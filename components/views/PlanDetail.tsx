"use client";
import { useState, type CSSProperties } from "react";
import { Hoverable } from "../primitives";
import { Icon, StatusGlyph } from "../icons";
import {
  sCard,
  sBtnPrimary,
  sBtnPrimaryHover,
  stepBtn,
  stepBtnHover,
  statusBtnHover,
  delBtn,
  delBtnHover,
  sortHover,
  trHover,
  mono,
} from "@/lib/styles";
import { SM } from "@/lib/theme";
import { estSec, fmtDur, dispVal, factorLevels } from "@/lib/calc";
import type { ConditionItem, Plan, PlanRow, Status } from "@/lib/types";

type Tab = "overview" | "conditions" | "table";
interface Sort {
  key: string;
  dir: "asc" | "desc";
}

const RANK: Record<Status, number> = { todo: 0, done: 1, check: 2 };

export function PlanDetail({
  plan,
  items,
  onToggleStatusMenu,
  onChangeCount,
  onDeleteRow,
  onReorder,
  onCloseMenu,
}: {
  plan: Plan;
  items: ConditionItem[];
  onToggleStatusMenu: (rowId: string, e: React.MouseEvent) => void;
  onChangeCount: (rowId: string, delta: number) => void;
  onDeleteRow: (rowId: string) => void;
  onReorder: (src: string, dst: string) => void;
  onCloseMenu: () => void;
}) {
  const [tab, setTab] = useState<Tab>("table");
  const [sort, setSortState] = useState<Sort | null>(null);
  const [dragRowId, setDragRowId] = useState<string | null>(null);
  const [dragOverRowId, setDragOverRowId] = useState<string | null>(null);

  const getItem = (id: string) => items.find((i) => i.id === id);

  const total = plan.rows.length;
  const done = plan.rows.filter((r) => r.status === "done").length;
  const check = plan.rows.filter((r) => r.status === "check").length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  let totSec = 0;
  let any = false;
  plan.rows.forEach((r) => {
    const e = estSec(r);
    if (e != null) {
      totSec += e;
      any = true;
    }
  });
  const sumDurLabel = any ? fmtDur(totSec) : "—";
  const checkColor = check > 0 ? "var(--st-check)" : "var(--ink-tertiary)";

  const setSort = (key: string) => {
    onCloseMenu();
    setSortState((cur) => {
      if (!cur || cur.key !== key) return { key, dir: "asc" };
      if (cur.dir === "asc") return { key, dir: "desc" };
      return null;
    });
  };

  const sortedRows = (): Array<{ r: PlanRow; i: number }> => {
    if (!sort) return plan.rows.map((r, i) => ({ r, i }));
    const dir = sort.dir === "desc" ? -1 : 1;
    const key = sort.key;
    const val = (r: PlanRow): number | string => {
      if (key === "__count") return r.count;
      if (key === "__est") {
        const e = estSec(r);
        return e == null ? -1 : e;
      }
      if (key === "__status") return RANK[r.status];
      const it = getItem(key);
      const v = r.values[key];
      if (it && it.type === "value") return typeof v === "number" ? v : parseFloat(String(v));
      return v == null ? "" : String(v);
    };
    const idx = plan.rows.map((r, i) => ({ r, i }));
    idx.sort((a, b) => {
      const va = val(a.r);
      const vb = val(b.r);
      let c: number;
      if (typeof va === "number" && typeof vb === "number") c = va - vb;
      else c = String(va).localeCompare(String(vb), "ja", { numeric: true });
      if (c !== 0) return c * dir;
      return a.i - b.i;
    });
    return idx;
  };

  // drag & drop
  const onDragStart = (rowId: string) => (e: React.DragEvent) => {
    setDragRowId(rowId);
    onCloseMenu();
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      try {
        e.dataTransfer.setData("text/plain", rowId);
      } catch {}
    }
  };
  const onDragOver = (rowId: string) => (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
    if (dragOverRowId !== rowId) setDragOverRowId(rowId);
  };
  const onDrop = (rowId: string) => (e: React.DragEvent) => {
    e.preventDefault();
    if (dragRowId) onReorder(dragRowId, rowId);
    setDragRowId(null);
    setDragOverRowId(null);
  };
  const onDragEnd = () => {
    setDragRowId(null);
    setDragOverRowId(null);
  };

  const sorted = !!sort;
  const dragHint = sorted
    ? "並べ替え中はドラッグ無効です。状態列などの見出しをもう一度押すと解除できます。"
    : "左端のハンドルをドラッグすると撮像順を並べ替えできます。列見出しを押すとソートできます。";

  // ---- styles ----
  const tabStyle = (on: boolean): CSSProperties => ({
    border: "none",
    background: "transparent",
    padding: "10px 14px",
    fontSize: 14,
    fontWeight: on ? 600 : 500,
    cursor: "pointer",
    color: on ? "var(--ink)" : "var(--ink-subtle)",
    borderBottom: on ? "2px solid var(--primary)" : "2px solid transparent",
    marginBottom: "-1px",
  });
  const sortHdr = (active: boolean, justify: CSSProperties["justifyContent"]): CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    width: "100%",
    height: "100%",
    padding: "12px 14px",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "0.04em",
    color: active ? "var(--ink)" : "var(--ink-tertiary)",
    whiteSpace: "nowrap",
    textAlign: "left",
    justifyContent: justify,
  });
  const arrowSt = (active: boolean): CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    color: active ? "var(--primary)" : "transparent",
    fontSize: "10px",
  });
  const sortInfo = (key: string) => {
    const active = sort?.key === key;
    return { active, arrow: active ? (sort!.dir === "asc" ? "▲" : "▼") : "▲" };
  };

  const statCard: CSSProperties = { ...sCard, padding: "18px 20px" };

  return (
    <div data-screen-label="要項詳細" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* tab bar */}
      <div
        style={{
          padding: "14px 40px 0",
          borderBottom: "1px solid var(--hairline)",
          flex: "0 0 auto",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 20,
        }}
      >
        <div style={{ display: "flex", gap: 2 }}>
          <button onClick={() => setTab("overview")} style={tabStyle(tab === "overview")}>
            概要
          </button>
          <button onClick={() => setTab("conditions")} style={tabStyle(tab === "conditions")}>
            条件・水準
          </button>
          <button onClick={() => setTab("table")} style={tabStyle(tab === "table")}>
            組み合わせ表
          </button>
        </div>
        <span style={{ fontSize: 12, color: "var(--ink-subtle)", fontFamily: mono, whiteSpace: "nowrap", paddingBottom: 11 }}>
          更新 {plan.updatedLabel}
        </span>
      </div>

      <div style={{ flex: 1, overflow: "auto" }}>
        {tab === "overview" && (
          <div style={{ maxWidth: 920, margin: "0 auto", padding: "36px 40px 80px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 28 }}>
              <div style={statCard}>
                <div style={{ fontSize: 12, color: "var(--ink-subtle)", marginBottom: 10 }}>撮像済み</div>
                <div style={{ fontSize: 26, fontWeight: 600, fontFamily: mono, color: "var(--ink)" }}>
                  {done}
                  <span style={{ fontSize: 15, color: "var(--ink-tertiary)" }}> / {total}</span>
                </div>
              </div>
              <div style={statCard}>
                <div style={{ fontSize: 12, color: "var(--ink-subtle)", marginBottom: 10 }}>進捗率</div>
                <div style={{ fontSize: 26, fontWeight: 600, fontFamily: mono, color: "var(--ink)", marginBottom: 8 }}>{pct}%</div>
                <div style={{ height: 5, background: "var(--surface-3)", borderRadius: 9999, overflow: "hidden" }}>
                  <div style={{ height: "100%", background: "var(--st-done)", width: `${pct}%` }} />
                </div>
              </div>
              <div style={statCard}>
                <div style={{ fontSize: 12, color: "var(--ink-subtle)", marginBottom: 10 }}>要確認</div>
                <div style={{ fontSize: 26, fontWeight: 600, fontFamily: mono, color: checkColor }}>
                  {check}
                  <span style={{ fontSize: 15, color: "var(--ink-tertiary)" }}> 件</span>
                </div>
              </div>
              <div style={statCard}>
                <div style={{ fontSize: 12, color: "var(--ink-subtle)", marginBottom: 10 }}>合計見積時間</div>
                <div style={{ fontSize: 22, fontWeight: 600, fontFamily: mono, color: "var(--ink)" }}>{sumDurLabel}</div>
              </div>
            </div>
            <div style={{ ...sCard, padding: "24px 26px" }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", color: "var(--ink-tertiary)", marginBottom: 12 }}>注意事項</div>
              {plan.note.trim() ? (
                <div style={{ fontSize: 15, color: "var(--ink-muted)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{plan.note}</div>
              ) : (
                <div style={{ fontSize: 14, color: "var(--ink-tertiary)" }}>注意事項は登録されていません。</div>
              )}
            </div>
            <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
              <Hoverable as="button" onClick={() => setTab("table")} style={sBtnPrimary} hoverStyle={sBtnPrimaryHover}>
                組み合わせ表を開く →
              </Hoverable>
            </div>
          </div>
        )}

        {tab === "conditions" && (
          <div style={{ maxWidth: 920, margin: "0 auto", padding: "36px 40px 80px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 16px",
                borderRadius: 10,
                background: "var(--surface-2)",
                border: "1px solid var(--hairline)",
                marginBottom: 20,
              }}
            >
              <span
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  border: "1.5px solid var(--ink-subtle)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  color: "var(--ink-subtle)",
                  flex: "0 0 auto",
                }}
              >
                i
              </span>
              <span style={{ fontSize: 13, color: "var(--ink-muted)" }}>
                生成後の条件値は直接編集できません。水準を変えるには要項を作り直してください。
              </span>
            </div>
            <div style={{ ...sCard, padding: "8px 24px" }}>
              {plan.factorOrder.map((cid) => {
                const it = getItem(cid);
                const lv = factorLevels(plan.rows, cid);
                return (
                  <div key={cid} style={{ display: "flex", alignItems: "flex-start", gap: 20, padding: "18px 0", borderBottom: "1px solid var(--hairline)" }}>
                    <div style={{ width: 140, flex: "0 0 auto" }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", whiteSpace: "nowrap" }}>{it ? it.name : cid}</div>
                      <div style={{ fontSize: 12, color: "var(--ink-subtle)", marginTop: 3 }}>{it && it.type === "select" ? "選択肢" : "値"}</div>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 7, paddingTop: 1 }}>
                      {lv.map((v) => (
                        <span
                          key={String(v)}
                          style={{ padding: "4px 11px", borderRadius: 7, background: "var(--surface-2)", border: "1px solid var(--hairline-strong)", fontSize: 13, fontFamily: mono, color: "var(--ink-muted)" }}
                        >
                          {dispVal(it, v)}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === "table" && (
          <div>
            <div
              style={{
                position: "sticky",
                top: 0,
                zIndex: 5,
                background: "var(--canvas)",
                borderBottom: "1px solid var(--hairline)",
                padding: "16px 40px",
                display: "flex",
                alignItems: "center",
                gap: 26,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <span style={{ fontSize: 13, color: "var(--ink-subtle)" }}>進捗</span>
                <span style={{ fontSize: 15, fontWeight: 600, fontFamily: mono, color: "var(--ink)" }}>
                  {done} / {total}
                </span>
                <div style={{ width: 120, height: 6, background: "var(--surface-3)", borderRadius: 9999, overflow: "hidden" }}>
                  <div style={{ height: "100%", background: "var(--st-done)", width: `${pct}%` }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{pct}%</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--st-check)" }} />
                <span style={{ fontSize: 13, color: "var(--ink-muted)" }}>
                  要確認 <span style={{ fontFamily: mono, fontWeight: 600, color: checkColor }}>{check}</span>
                </span>
              </div>
              <div style={{ flex: 1 }} />
              <span style={{ fontSize: 13, color: "var(--ink-subtle)" }}>合計見積時間</span>
              <span style={{ fontSize: 15, fontWeight: 600, fontFamily: mono, color: "var(--ink)" }}>{sumDurLabel}</span>
            </div>

            <div style={{ padding: "8px 40px 100px", overflowX: "auto" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "2px 6px 10px", color: "var(--ink-tertiary)", fontSize: 12 }}>
                <Icon name="grip" size={13} sw={0} />
                <span>{dragHint}</span>
              </div>
              <table style={{ width: "100%", minWidth: 760, borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--hairline-strong)" }}>
                    <th style={{ width: 34 }} />
                    <th style={{ textAlign: "left", padding: "12px 8px", fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", color: "var(--ink-tertiary)", width: 40 }}>#</th>
                    {plan.factorOrder.map((cid) => {
                      const it = getItem(cid);
                      const si = sortInfo(cid);
                      return (
                        <th key={cid} style={{ padding: 0, whiteSpace: "nowrap" }}>
                          <Hoverable as="button" onClick={() => setSort(cid)} style={sortHdr(si.active, "flex-start")} hoverStyle={sortHover}>
                            <span>{it ? it.name : cid}</span>
                            <span style={arrowSt(si.active)}>{si.arrow}</span>
                          </Hoverable>
                        </th>
                      );
                    })}
                    {(() => {
                      const ci = sortInfo("__count");
                      const ei = sortInfo("__est");
                      const sti = sortInfo("__status");
                      return (
                        <>
                          <th style={{ padding: 0, width: 118, whiteSpace: "nowrap" }}>
                            <Hoverable as="button" onClick={() => setSort("__count")} style={sortHdr(ci.active, "center")} hoverStyle={sortHover}>
                              <span>撮像回数</span>
                              <span style={arrowSt(ci.active)}>{ci.arrow}</span>
                            </Hoverable>
                          </th>
                          <th style={{ padding: 0, width: 108, whiteSpace: "nowrap" }}>
                            <Hoverable as="button" onClick={() => setSort("__est")} style={sortHdr(ei.active, "flex-end")} hoverStyle={sortHover}>
                              <span>見積時間</span>
                              <span style={arrowSt(ei.active)}>{ei.arrow}</span>
                            </Hoverable>
                          </th>
                          <th style={{ padding: 0, width: 92, whiteSpace: "nowrap" }}>
                            <Hoverable as="button" onClick={() => setSort("__status")} style={sortHdr(sti.active, "center")} hoverStyle={sortHover}>
                              <span>状態</span>
                              <span style={arrowSt(sti.active)}>{sti.arrow}</span>
                            </Hoverable>
                          </th>
                        </>
                      );
                    })()}
                    <th style={{ width: 44 }} />
                  </tr>
                </thead>
                <tbody>
                  {sortedRows().map((entry, idx) => {
                    const r = entry.r;
                    const meta = SM[r.status];
                    const e = estSec(r);
                    const isDrag = dragRowId === r.id;
                    const isOver = dragOverRowId === r.id && dragRowId != null && dragRowId !== r.id;
                    const rowBg = r.status === "check" ? "var(--st-check-bg)" : "transparent";
                    return (
                      <Hoverable
                        as="tr"
                        key={r.id}
                        style={{
                          borderBottom: "1px solid var(--hairline)",
                          background: isOver ? "var(--surface-2)" : rowBg,
                          opacity: isDrag ? 0.4 : 1,
                          boxShadow: isOver ? "inset 0 2px 0 var(--primary)" : "none",
                        }}
                        hoverStyle={trHover}
                        onDragOver={onDragOver(r.id)}
                        onDrop={onDrop(r.id)}
                        onDragEnd={onDragEnd}
                      >
                        <td style={{ padding: "0 2px 0 8px" }}>
                          <span
                            draggable={!sorted}
                            onDragStart={sorted ? (ev) => ev.preventDefault() : onDragStart(r.id)}
                            title="ドラッグで並べ替え"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "var(--ink-tertiary)",
                              cursor: sorted ? "not-allowed" : "grab",
                              padding: "2px",
                              opacity: sorted ? 0.3 : 1,
                            }}
                          >
                            <Icon name="grip" size={16} sw={0} />
                          </span>
                        </td>
                        <td style={{ padding: "11px 8px", fontSize: 13, color: "var(--ink-tertiary)", fontFamily: mono }}>{idx + 1}</td>
                        {plan.factorOrder.map((cid) => (
                          <td key={cid} style={{ padding: "11px 14px", fontSize: 13, color: "var(--ink)", fontFamily: mono, whiteSpace: "nowrap" }}>
                            {dispVal(getItem(cid), r.values[cid])}
                          </td>
                        ))}
                        <td style={{ padding: "11px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2 }}>
                            <Hoverable as="button" onClick={() => onChangeCount(r.id, -1)} style={stepBtn} hoverStyle={stepBtnHover}>
                              −
                            </Hoverable>
                            <span style={{ width: 30, textAlign: "center", fontSize: 13, fontWeight: 600, fontFamily: mono, color: "var(--ink)" }}>{r.count}</span>
                            <Hoverable as="button" onClick={() => onChangeCount(r.id, 1)} style={stepBtn} hoverStyle={stepBtnHover}>
                              ＋
                            </Hoverable>
                          </div>
                        </td>
                        <td style={{ padding: "11px 14px", textAlign: "right", fontSize: 13, color: "var(--ink-muted)", fontFamily: mono, whiteSpace: "nowrap" }}>
                          {fmtDur(e)}
                        </td>
                        <td style={{ padding: "11px 14px", textAlign: "center" }}>
                          <Hoverable
                            as="button"
                            title={meta.label}
                            onClick={(ev: React.MouseEvent) => onToggleStatusMenu(r.id, ev)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: 34,
                              height: 30,
                              borderRadius: 8,
                              cursor: "pointer",
                              border: "1px solid transparent",
                              background: `var(${meta.bg})`,
                            }}
                            hoverStyle={statusBtnHover}
                          >
                            <span style={{ display: "flex" }}>
                              <StatusGlyph status={r.status} size={16} />
                            </span>
                          </Hoverable>
                        </td>
                        <td style={{ padding: "11px 8px", textAlign: "center" }}>
                          <Hoverable as="button" onClick={() => onDeleteRow(r.id)} style={delBtn} hoverStyle={delBtnHover}>
                            ✕
                          </Hoverable>
                        </td>
                      </Hoverable>
                    );
                  })}
                </tbody>
              </table>
              {plan.rows.length === 0 && (
                <div style={{ padding: 48, textAlign: "center", color: "var(--ink-subtle)", fontSize: 14 }}>すべての行が削除されました。</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
