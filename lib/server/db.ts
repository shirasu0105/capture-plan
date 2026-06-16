// SQLite persistence layer (server only) using Node's built-in node:sqlite.
// A single shared connection is cached on globalThis so it survives dev HMR.
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import type {
  ConditionItem,
  ItemType,
  Plan,
  PlanRow,
  PlanSummary,
  Status,
} from "../types";
import { buildRowValues, nowLabel, type FactorSpec } from "../calc";

const DB_PATH = join(process.cwd(), "data", "capture-plan.db");

interface Cache {
  db: DatabaseSync;
}
const g = globalThis as unknown as { __capturePlanDb?: Cache };

function getDb(): DatabaseSync {
  if (g.__capturePlanDb) return g.__capturePlanDb.db;
  mkdirSync(join(process.cwd(), "data"), { recursive: true });
  const db = new DatabaseSync(DB_PATH);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec(`
    CREATE TABLE IF NOT EXISTS condition_items (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      type       TEXT NOT NULL,
      options    TEXT,
      min        REAL,
      max        REAL,
      step       REAL,
      unit       TEXT,
      locked     INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS plans (
      id            TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      note          TEXT NOT NULL DEFAULT '',
      factor_order  TEXT NOT NULL DEFAULT '[]',
      created_label TEXT NOT NULL,
      updated_label TEXT NOT NULL,
      sort_order    INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS plan_rows (
      id         TEXT PRIMARY KEY,
      plan_id    TEXT NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
      values_json TEXT NOT NULL,
      count      INTEGER NOT NULL DEFAULT 1,
      status     TEXT NOT NULL DEFAULT 'todo',
      sort_order INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_rows_plan ON plan_rows(plan_id, sort_order);
  `);
  g.__capturePlanDb = { db };
  seedIfEmpty(db);
  ensureLockedItems(db);
  return db;
}

function uid(prefix: string): string {
  return prefix + "_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

// ---------------------------------------------------------------------------
// 固定項目（投影枚数・露光時間）
// 見積撮像時間 = 投影枚数 × 露光時間[ms] × 撮像回数 ÷ 1000 の計算に使うため、
// 名称・形式(値)・単位は固定。最小値・最大値・刻み幅のみ編集できる。
// ---------------------------------------------------------------------------
interface LockedItemDef {
  id: string;
  name: string;
  unit: string;
  min: number;
  max: number;
  step: number;
}
const LOCKED_ITEMS: LockedItemDef[] = [
  { id: "proj", name: "投影枚数", unit: "枚", min: 100, max: 3600, step: 100 },
  { id: "exp", name: "露光時間", unit: "ms", min: 1, max: 1000, step: 1 },
];
const LOCKED_BY_ID = new Map(LOCKED_ITEMS.map((l) => [l.id, l] as const));

/**
 * 固定項目が常に「値形式・正しい名称/単位・locked」で存在することを保証する。
 * 既存DBで誤って編集された固定項目（例: 形式を select 化して min/max を失った）を
 * 起動時に修復する。min/max/step はユーザー編集可なので、欠損時のみ既定値で補う。
 */
function ensureLockedItems(db: DatabaseSync) {
  for (const l of LOCKED_ITEMS) {
    const cur = db
      .prepare("SELECT min, max, step FROM condition_items WHERE id = ?")
      .get(l.id) as { min: number | null; max: number | null; step: number | null } | undefined;
    if (!cur) {
      const m = db.prepare("SELECT COALESCE(MAX(sort_order),-1) AS m FROM condition_items").get() as {
        m: number;
      };
      db.prepare(
        `INSERT INTO condition_items (id,name,type,options,min,max,step,unit,locked,sort_order)
         VALUES (?,?,'value',NULL,?,?,?,?,1,?)`,
      ).run(l.id, l.name, l.min, l.max, l.step, l.unit, m.m + 1);
      continue;
    }
    db.prepare(
      `UPDATE condition_items
         SET name=?, type='value', options=NULL, unit=?, locked=1, min=?, max=?, step=?
       WHERE id=?`,
    ).run(l.name, l.unit, cur.min ?? l.min, cur.max ?? l.max, cur.step ?? l.step, l.id);
  }
}

// ---------------------------------------------------------------------------
// Seed (prototype's seedItems + seedPlans)
// ---------------------------------------------------------------------------
function seedIfEmpty(db: DatabaseSync) {
  const row = db.prepare("SELECT COUNT(*) AS n FROM condition_items").get() as {
    n: number;
  };
  if (row.n > 0) return;

  const items: ConditionItem[] = [
    ...LOCKED_ITEMS.map(
      (l): ConditionItem => ({
        id: l.id,
        name: l.name,
        type: "value",
        min: l.min,
        max: l.max,
        step: l.step,
        unit: l.unit,
        locked: true,
      }),
    ),
    { id: "kv", name: "管電圧", type: "value", min: 50, max: 300, step: 10, unit: "kV" },
    { id: "ua", name: "管電流", type: "value", min: 10, max: 500, step: 10, unit: "µA" },
    { id: "angle", name: "照射角度", type: "select", options: ["0°", "30°", "45°", "60°", "90°"] },
    { id: "target", name: "検査対象", type: "select", options: ["基板A", "基板B", "コネクタ", "はんだ接合部"] },
    { id: "filter", name: "金属フィルタ", type: "select", options: ["ON", "OFF"] },
  ];
  const insItem = db.prepare(
    `INSERT INTO condition_items (id,name,type,options,min,max,step,unit,locked,sort_order)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
  );
  items.forEach((it, i) =>
    insItem.run(
      it.id,
      it.name,
      it.type,
      it.options ? JSON.stringify(it.options) : null,
      it.min ?? null,
      it.max ?? null,
      it.step ?? null,
      it.unit ?? null,
      it.locked ? 1 : 0,
      i,
    ),
  );

  type StFn = (i: number, n: number) => Status;
  const mk = (
    name: string,
    note: string,
    spec: FactorSpec[],
    created: string,
    updated: string,
    stf: StFn,
    order: number,
  ) => {
    const pid = uid("plan");
    db.prepare(
      `INSERT INTO plans (id,name,note,factor_order,created_label,updated_label,sort_order)
       VALUES (?,?,?,?,?,?,?)`,
    ).run(pid, name, note, JSON.stringify(spec.map((s) => s.condId)), created, updated, order);
    const values = buildRowValues(spec);
    const insRow = db.prepare(
      `INSERT INTO plan_rows (id,plan_id,values_json,count,status,sort_order) VALUES (?,?,?,?,?,?)`,
    );
    values.forEach((v, i) =>
      insRow.run(uid("row"), pid, JSON.stringify(v), 1, stf(i, values.length), i),
    );
  };

  mk(
    "基板はんだ接合部 学習データ 第1弾",
    "基板A/Bのはんだ接合部を対象に、管電圧と露光時間を振って学習用データを取得する。ボイド検出モデル向け。\n撮像後は接合部が画角中央に来ているか必ず確認すること。",
    [
      { condId: "target", levels: ["基板A", "基板B"] },
      { condId: "kv", levels: [150, 300] },
      { condId: "proj", levels: [1200] },
      { condId: "exp", levels: [100, 200] },
    ],
    "2026-06-08 14:20",
    "2026-06-10 09:42",
    (i, n) => (i < n - 3 ? "done" : i === n - 2 ? "check" : "todo"),
    2,
  );
  mk(
    "コネクタ実装 照射角度ばらつきデータ",
    "照射角度を3水準振って、コネクタ実装部の見え方を比較する。30°で陰になる箇所があれば要確認に。",
    [
      { condId: "angle", levels: ["30°", "45°", "60°"] },
      { condId: "kv", levels: [100, 200] },
      { condId: "proj", levels: [600] },
      { condId: "exp", levels: [100] },
    ],
    "2026-06-05 11:05",
    "2026-06-09 17:30",
    (i) => (i < 2 ? "done" : i === 2 ? "check" : "todo"),
    1,
  );
  mk(
    "金属フィルタ有無 比較セット",
    "金属フィルタON/OFFでのコントラスト差を確認する比較用データ。",
    [
      { condId: "filter", levels: ["ON", "OFF"] },
      { condId: "target", levels: ["基板A"] },
      { condId: "proj", levels: [2400] },
      { condId: "exp", levels: [150, 300] },
    ],
    "2026-06-10 10:15",
    "2026-06-10 10:15",
    () => "todo",
    0,
  );
}

// ---------------------------------------------------------------------------
// Row mapping helpers
// ---------------------------------------------------------------------------
interface ItemRow {
  id: string;
  name: string;
  type: string;
  options: string | null;
  min: number | null;
  max: number | null;
  step: number | null;
  unit: string | null;
  locked: number;
}
function mapItem(r: ItemRow): ConditionItem {
  const it: ConditionItem = { id: r.id, name: r.name, type: r.type as ItemType };
  if (r.type === "select") it.options = r.options ? JSON.parse(r.options) : [];
  else {
    it.min = r.min ?? undefined;
    it.max = r.max ?? undefined;
    it.step = r.step ?? undefined;
    it.unit = r.unit ?? undefined;
  }
  if (r.locked) it.locked = true;
  return it;
}

interface RawRow {
  id: string;
  values_json: string;
  count: number;
  status: string;
}
function mapRow(r: RawRow): PlanRow {
  return {
    id: r.id,
    values: JSON.parse(r.values_json),
    count: r.count,
    status: r.status as Status,
  };
}

// ---------------------------------------------------------------------------
// Condition items
// ---------------------------------------------------------------------------
export function listItems(): ConditionItem[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM condition_items ORDER BY sort_order, rowid")
    .all() as unknown as ItemRow[];
  return rows.map(mapItem);
}

export interface ItemInput {
  name: string;
  type: ItemType;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}
export function createItem(data: ItemInput): ConditionItem {
  const db = getDb();
  const id = uid("cond");
  const max = db.prepare("SELECT COALESCE(MAX(sort_order),-1) AS m FROM condition_items").get() as {
    m: number;
  };
  db.prepare(
    `INSERT INTO condition_items (id,name,type,options,min,max,step,unit,locked,sort_order)
     VALUES (?,?,?,?,?,?,?,?,0,?)`,
  ).run(
    id,
    data.name,
    data.type,
    data.type === "select" ? JSON.stringify(data.options ?? []) : null,
    data.type === "value" ? data.min ?? null : null,
    data.type === "value" ? data.max ?? null : null,
    data.type === "value" ? data.step ?? null : null,
    data.type === "value" ? data.unit ?? null : null,
    max.m + 1,
  );
  return listItems().find((i) => i.id === id)!;
}

export function updateItem(id: string, data: ItemInput): ConditionItem | null {
  const db = getDb();
  const cur = db
    .prepare("SELECT min, max, step, locked FROM condition_items WHERE id = ?")
    .get(id) as
    | { min: number | null; max: number | null; step: number | null; locked: number }
    | undefined;
  if (!cur) return null;

  // 固定項目（投影枚数・露光時間）は見積時間の計算に使うため、名称・形式・単位を
  // canonical 値に固定し、最小値・最大値・刻み幅のみ更新できる。
  const lockedDef = cur.locked ? LOCKED_BY_ID.get(id) : undefined;
  const type: ItemType = lockedDef ? "value" : data.type;
  const name = lockedDef ? lockedDef.name : data.name;
  const unit = lockedDef ? lockedDef.unit : type === "value" ? data.unit ?? null : null;
  const min = type === "value" ? data.min ?? cur.min ?? null : null;
  const max = type === "value" ? data.max ?? cur.max ?? null : null;
  const step = type === "value" ? data.step ?? cur.step ?? null : null;
  const options = type === "select" ? JSON.stringify(data.options ?? []) : null;

  db.prepare(
    `UPDATE condition_items
       SET name=?, type=?, options=?, min=?, max=?, step=?, unit=?
     WHERE id=?`,
  ).run(name, type, options, min, max, step, unit, id);
  return listItems().find((i) => i.id === id) ?? null;
}

/** locked 項目は削除不可。成功時 true */
export function deleteItem(id: string): boolean {
  const db = getDb();
  const it = db.prepare("SELECT locked FROM condition_items WHERE id = ?").get(id) as
    | { locked: number }
    | undefined;
  if (!it || it.locked) return false;
  db.prepare("DELETE FROM condition_items WHERE id = ?").run(id);
  return true;
}

// ---------------------------------------------------------------------------
// Plans
// ---------------------------------------------------------------------------
export function listPlanSummaries(): PlanSummary[] {
  const db = getDb();
  const plans = db
    .prepare("SELECT * FROM plans ORDER BY sort_order DESC, rowid DESC")
    .all() as unknown as Array<{
    id: string;
    name: string;
    note: string;
    factor_order: string;
    created_label: string;
    updated_label: string;
  }>;
  const counts = db.prepare(
    `SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status='done'  THEN 1 ELSE 0 END) AS done,
        SUM(CASE WHEN status='check' THEN 1 ELSE 0 END) AS chk
     FROM plan_rows WHERE plan_id = ?`,
  );
  return plans.map((p) => {
    const c = counts.get(p.id) as { total: number; done: number | null; chk: number | null };
    return {
      id: p.id,
      name: p.name,
      note: p.note,
      factorOrder: JSON.parse(p.factor_order),
      createdLabel: p.created_label,
      updatedLabel: p.updated_label,
      totalCount: c.total ?? 0,
      doneCount: c.done ?? 0,
      checkCount: c.chk ?? 0,
    };
  });
}

export function getPlan(id: string): Plan | null {
  const db = getDb();
  const p = db.prepare("SELECT * FROM plans WHERE id = ?").get(id) as
    | {
        id: string;
        name: string;
        note: string;
        factor_order: string;
        created_label: string;
        updated_label: string;
      }
    | undefined;
  if (!p) return null;
  const rows = db
    .prepare("SELECT * FROM plan_rows WHERE plan_id = ? ORDER BY sort_order, rowid")
    .all(id) as unknown as RawRow[];
  return {
    id: p.id,
    name: p.name,
    note: p.note,
    factorOrder: JSON.parse(p.factor_order),
    createdLabel: p.created_label,
    updatedLabel: p.updated_label,
    rows: rows.map(mapRow),
  };
}

export interface CreatePlanInput {
  name: string;
  note: string;
  factorOrder: string[];
  levels: Record<string, Array<string | number>>;
}
export function createPlan(input: CreatePlanInput): Plan {
  const db = getDb();
  const spec: FactorSpec[] = input.factorOrder
    .filter((id) => (input.levels[id] || []).length > 0)
    .map((id) => ({ condId: id, levels: input.levels[id] }));
  const now = nowLabel();
  const pid = uid("plan");
  const max = db.prepare("SELECT COALESCE(MAX(sort_order),-1) AS m FROM plans").get() as {
    m: number;
  };
  db.prepare(
    `INSERT INTO plans (id,name,note,factor_order,created_label,updated_label,sort_order)
     VALUES (?,?,?,?,?,?,?)`,
  ).run(
    pid,
    input.name.trim() || "無題のデータ取り要項",
    input.note ?? "",
    JSON.stringify(spec.map((s) => s.condId)),
    now,
    now,
    max.m + 1,
  );
  const values = buildRowValues(spec);
  const insRow = db.prepare(
    `INSERT INTO plan_rows (id,plan_id,values_json,count,status,sort_order) VALUES (?,?,?,1,'todo',?)`,
  );
  values.forEach((v, i) => insRow.run(uid("row"), pid, JSON.stringify(v), i));
  return getPlan(pid)!;
}

export function deletePlan(id: string): boolean {
  const db = getDb();
  const r = db.prepare("DELETE FROM plans WHERE id = ?").run(id);
  return r.changes > 0;
}

function touchPlan(db: DatabaseSync, planId: string) {
  db.prepare("UPDATE plans SET updated_label = ? WHERE id = ?").run(nowLabel(), planId);
}

export function updateRow(
  planId: string,
  rowId: string,
  patch: { status?: Status; count?: number },
): boolean {
  const db = getDb();
  const cur = db
    .prepare("SELECT count, status FROM plan_rows WHERE id = ? AND plan_id = ?")
    .get(rowId, planId) as { count: number; status: string } | undefined;
  if (!cur) return false;
  const count = patch.count != null ? Math.max(1, Math.round(patch.count)) : cur.count;
  const status = patch.status ?? cur.status;
  db.prepare("UPDATE plan_rows SET count = ?, status = ? WHERE id = ?").run(count, status, rowId);
  touchPlan(db, planId);
  return true;
}

export function deleteRow(planId: string, rowId: string): boolean {
  const db = getDb();
  const r = db.prepare("DELETE FROM plan_rows WHERE id = ? AND plan_id = ?").run(rowId, planId);
  if (r.changes > 0) touchPlan(db, planId);
  return r.changes > 0;
}

/** src 行を dst 行の位置へ移動 (sort_order を振り直す) */
export function reorderRows(planId: string, srcId: string, dstId: string): boolean {
  const db = getDb();
  if (!srcId || srcId === dstId) return false;
  const rows = db
    .prepare("SELECT id FROM plan_rows WHERE plan_id = ? ORDER BY sort_order, rowid")
    .all(planId) as unknown as Array<{ id: string }>;
  const ids = rows.map((r) => r.id);
  const si = ids.indexOf(srcId);
  const di = ids.indexOf(dstId);
  if (si < 0 || di < 0) return false;
  const [moved] = ids.splice(si, 1);
  ids.splice(di, 0, moved);
  const upd = db.prepare("UPDATE plan_rows SET sort_order = ? WHERE id = ?");
  ids.forEach((id, i) => upd.run(i, id));
  touchPlan(db, planId);
  return true;
}
