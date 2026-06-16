"use client";
// Client data layer: initial load, ~4s polling for multi-user sync, and
// optimistic mutations against the REST API.
import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ConditionItem,
  GeneratePlanInput,
  Plan,
  PlanSummary,
  Status,
} from "./types";
import type { ItemInput } from "./server/db";

const POLL_MS = 4000;
const SUPPRESS_MS = 1500; // ignore plan-poll right after a local edit

async function j<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(opts?.headers || {}) },
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) msg = body.error;
    } catch {}
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export interface AppData {
  ready: boolean;
  items: ConditionItem[];
  plans: PlanSummary[];
  currentPlan: Plan | null;
  refresh: () => Promise<void>;
  openPlan: (id: string) => Promise<Plan | null>;
  closePlan: () => void;
  createItem: (input: ItemInput) => Promise<void>;
  updateItem: (id: string, input: ItemInput) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  createPlan: (input: GeneratePlanInput) => Promise<Plan>;
  deletePlan: (id: string) => Promise<void>;
  setRowStatus: (rowId: string, status: Status) => Promise<void>;
  changeRowCount: (rowId: string, delta: number) => Promise<void>;
  deleteRow: (rowId: string) => Promise<void>;
  reorderRows: (src: string, dst: string) => Promise<void>;
}

export function useAppData(): AppData {
  const [ready, setReady] = useState(false);
  const [items, setItems] = useState<ConditionItem[]>([]);
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);

  const openIdRef = useRef<string | null>(null);
  const suppressUntilRef = useRef<number>(0);
  // Mirrors currentPlan synchronously so mutations always read the latest
  // value (React state updaters run async; reading them back is unreliable).
  const planRef = useRef<Plan | null>(null);

  const commitPlan = useCallback((p: Plan | null) => {
    planRef.current = p;
    setCurrentPlan(p);
  }, []);

  const touchSuppress = () => {
    suppressUntilRef.current = Date.now() + SUPPRESS_MS;
  };

  const refresh = useCallback(async () => {
    const data = await j<{ items: ConditionItem[]; plans: PlanSummary[] }>("/api/state");
    setItems(data.items);
    setPlans(data.plans);
  }, []);

  const openPlan = useCallback(
    async (id: string) => {
      openIdRef.current = id;
      try {
        const plan = await j<Plan>(`/api/plans/${id}`);
        if (openIdRef.current === id) commitPlan(plan);
        return plan;
      } catch {
        return null;
      }
    },
    [commitPlan],
  );

  const closePlan = useCallback(() => {
    openIdRef.current = null;
    commitPlan(null);
  }, [commitPlan]);

  // Initial load
  useEffect(() => {
    refresh().finally(() => setReady(true));
  }, [refresh]);

  // Polling for multi-user sync
  useEffect(() => {
    const tick = async () => {
      try {
        await refresh();
      } catch {}
      const id = openIdRef.current;
      if (id && Date.now() >= suppressUntilRef.current) {
        try {
          const plan = await j<Plan>(`/api/plans/${id}`);
          if (openIdRef.current === id && Date.now() >= suppressUntilRef.current) commitPlan(plan);
        } catch {}
      }
    };
    const h = setInterval(tick, POLL_MS);
    return () => clearInterval(h);
  }, [refresh, commitPlan]);

  // ---- condition items ----
  const createItem = useCallback(
    async (input: ItemInput) => {
      await j("/api/items", { method: "POST", body: JSON.stringify(input) });
      await refresh();
    },
    [refresh],
  );
  const updateItem = useCallback(
    async (id: string, input: ItemInput) => {
      await j(`/api/items/${id}`, { method: "PUT", body: JSON.stringify(input) });
      await refresh();
    },
    [refresh],
  );
  const deleteItem = useCallback(
    async (id: string) => {
      await j(`/api/items/${id}`, { method: "DELETE" });
      await refresh();
    },
    [refresh],
  );

  // ---- plans ----
  const createPlan = useCallback(
    async (input: GeneratePlanInput) => {
      const plan = await j<Plan>("/api/plans", { method: "POST", body: JSON.stringify(input) });
      openIdRef.current = plan.id;
      commitPlan(plan);
      return plan;
    },
    [commitPlan],
  );
  const deletePlan = useCallback(
    async (id: string) => {
      await j(`/api/plans/${id}`, { method: "DELETE" });
      if (openIdRef.current === id) closePlan();
      await refresh();
    },
    [refresh, closePlan],
  );

  // ---- rows (operate on the open plan; read+write via planRef) ----
  const patchRow = useCallback(async (rowId: string, patch: { status?: Status; count?: number }) => {
    const id = openIdRef.current;
    if (!id) return;
    await j(`/api/plans/${id}/rows/${rowId}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }).catch(() => {});
  }, []);

  const setRowStatus = useCallback(
    async (rowId: string, status: Status) => {
      const plan = planRef.current;
      if (!plan) return;
      touchSuppress();
      commitPlan({ ...plan, rows: plan.rows.map((r) => (r.id === rowId ? { ...r, status } : r)) });
      await patchRow(rowId, { status });
      touchSuppress();
    },
    [commitPlan, patchRow],
  );

  const changeRowCount = useCallback(
    async (rowId: string, delta: number) => {
      const plan = planRef.current;
      if (!plan) return;
      const row = plan.rows.find((r) => r.id === rowId);
      if (!row) return;
      const next = Math.max(1, row.count + delta);
      touchSuppress();
      commitPlan({ ...plan, rows: plan.rows.map((r) => (r.id === rowId ? { ...r, count: next } : r)) });
      await patchRow(rowId, { count: next });
      touchSuppress();
    },
    [commitPlan, patchRow],
  );

  const deleteRow = useCallback(
    async (rowId: string) => {
      const id = openIdRef.current;
      const plan = planRef.current;
      if (!id || !plan) return;
      touchSuppress();
      commitPlan({ ...plan, rows: plan.rows.filter((r) => r.id !== rowId) });
      await j(`/api/plans/${id}/rows/${rowId}`, { method: "DELETE" }).catch(() => {});
      touchSuppress();
    },
    [commitPlan],
  );

  const reorderRows = useCallback(
    async (src: string, dst: string) => {
      const id = openIdRef.current;
      const plan = planRef.current;
      if (!id || !plan || !src || src === dst) return;
      const rows = plan.rows.slice();
      const si = rows.findIndex((r) => r.id === src);
      const di = rows.findIndex((r) => r.id === dst);
      if (si < 0 || di < 0) return;
      const [m] = rows.splice(si, 1);
      rows.splice(di, 0, m);
      touchSuppress();
      commitPlan({ ...plan, rows });
      await j(`/api/plans/${id}/rows/reorder`, {
        method: "POST",
        body: JSON.stringify({ src, dst }),
      }).catch(() => {});
      touchSuppress();
    },
    [commitPlan],
  );

  return {
    ready,
    items,
    plans,
    currentPlan,
    refresh,
    openPlan,
    closePlan,
    createItem,
    updateItem,
    deleteItem,
    createPlan,
    deletePlan,
    setRowStatus,
    changeRowCount,
    deleteRow,
    reorderRows,
  };
}
