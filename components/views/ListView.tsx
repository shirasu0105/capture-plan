"use client";
import { useState } from "react";
import { Hoverable } from "../primitives";
import { Icon } from "../icons";
import { ConfirmDialog } from "../ConfirmDialog";
import { sCard, rowHover, mono, delBtn, delBtnHover } from "@/lib/styles";
import type { PlanSummary } from "@/lib/types";

const GRID = "minmax(0,1fr) 132px 188px 60px 40px";

export function ListView({
  plans,
  onOpen,
  onDelete,
}: {
  plans: PlanSummary[];
  onOpen: (id: string) => void;
  onDelete: (id: string) => void | Promise<void>;
}) {
  const [pending, setPending] = useState<PlanSummary | null>(null);

  return (
    <div data-screen-label="要項一覧" style={{ flex: 1, overflow: "auto" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 48px 96px" }}>
        <p
          style={{
            margin: "0 0 22px",
            fontSize: 14,
            color: "var(--ink-subtle)",
            lineHeight: 1.5,
            maxWidth: 620,
          }}
        >
          撮像条件の組み合わせと進捗を、要項ごとに管理します。表に並ぶ行はすべて撮像対象です。
        </p>
        <div style={{ ...sCard, overflow: "hidden" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: GRID,
              gap: 16,
              padding: "13px 24px",
              borderBottom: "1px solid var(--hairline)",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.05em",
              color: "var(--ink-tertiary)",
              whiteSpace: "nowrap",
            }}
          >
            <span>計画名</span>
            <span>更新</span>
            <span>進捗</span>
            <span style={{ textAlign: "right" }}>要確認</span>
            <span aria-hidden />
          </div>

          {plans.map((p) => {
            const total = p.totalCount;
            const done = p.doneCount;
            const pct = total ? Math.round((done / total) * 100) : 0;
            return (
              <Hoverable
                key={p.id}
                onClick={() => onOpen(p.id)}
                style={{
                  display: "grid",
                  gridTemplateColumns: GRID,
                  gap: 16,
                  alignItems: "center",
                  padding: "18px 24px",
                  borderBottom: "1px solid var(--hairline)",
                  cursor: "pointer",
                }}
                hoverStyle={rowHover}
              >
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: "var(--ink)",
                      letterSpacing: "-0.01em",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {p.name}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--ink-subtle)",
                      marginTop: 4,
                      fontFamily: mono,
                      whiteSpace: "nowrap",
                    }}
                  >
                    作成 {p.createdLabel}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "var(--ink-muted)", fontFamily: mono, whiteSpace: "nowrap" }}>
                  {p.updatedLabel}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
                    <span style={{ fontSize: 13, fontFamily: mono, color: "var(--ink-muted)" }}>
                      {done} / {total}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)" }}>{pct}%</span>
                  </div>
                  <div style={{ height: 6, background: "var(--surface-3)", borderRadius: 9999, overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 9999, background: "var(--st-done)", width: `${pct}%` }} />
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  {p.checkCount > 0 ? (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "3px 9px",
                        borderRadius: 9999,
                        background: "var(--st-check-bg)",
                        color: "var(--st-check)",
                        fontSize: 12,
                        fontWeight: 600,
                        fontFamily: mono,
                      }}
                    >
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--st-check)" }} />
                      {p.checkCount}
                    </span>
                  ) : (
                    <span style={{ fontSize: 13, color: "var(--ink-tertiary)" }}>—</span>
                  )}
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <Hoverable
                    as="button"
                    title="この要項を削除"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPending(p);
                    }}
                    style={delBtn}
                    hoverStyle={delBtnHover}
                  >
                    <Icon name="trash" size={15} />
                  </Hoverable>
                </div>
              </Hoverable>
            );
          })}
        </div>
      </div>

      {pending && (
        <ConfirmDialog
          title="要項を削除"
          message={`「${pending.name}」を削除します。${pending.totalCount}件の撮像対象も一緒に削除され、元に戻せません。`}
          confirmLabel="削除する"
          onConfirm={async () => {
            await onDelete(pending.id);
            setPending(null);
          }}
          onCancel={() => setPending(null)}
        />
      )}
    </div>
  );
}
