"use client";
import type { CSSProperties } from "react";
import { Hoverable } from "../primitives";
import { Icon } from "../icons";
import { sCard, iconBtn, iconBtnHover, mono } from "@/lib/styles";
import type { ConditionItem } from "@/lib/types";

function detailLabel(it: ConditionItem): string {
  if (it.type === "select") return (it.options || []).join(" / ");
  return `${it.min}〜${it.max} / ${it.step}刻み${it.unit ? " / " + it.unit : ""}`;
}

const delLocked: CSSProperties = {
  width: 30,
  height: 30,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "none",
  borderRadius: 7,
  background: "transparent",
  color: "var(--ink-tertiary)",
  opacity: 0.35,
  cursor: "not-allowed",
};
const delNormal: CSSProperties = {
  width: 30,
  height: 30,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "none",
  borderRadius: 7,
  background: "transparent",
  color: "var(--ink-subtle)",
  cursor: "pointer",
};

export function SettingsView({
  items,
  onEdit,
  onDelete,
}: {
  items: ConditionItem[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div data-screen-label="アプリ設定" style={{ flex: 1, overflow: "auto" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 48px 96px" }}>
        <p style={{ margin: "0 0 22px", fontSize: 14, color: "var(--ink-subtle)", maxWidth: 560, lineHeight: 1.5 }}>
          データ取り要項で使う条件項目を定義します。投影枚数・露光時間は見積時間の算出に使うため削除できません。
        </p>
        <div style={{ ...sCard, overflow: "hidden" }}>
          {items.map((it) => (
            <div
              key={it.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "16px 22px",
                borderBottom: "1px solid var(--hairline)",
              }}
            >
              <div style={{ width: 170, flex: "0 0 auto", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>{it.name}</span>
                {it.locked && (
                  <span
                    style={{
                      fontSize: 10,
                      padding: "1px 6px",
                      borderRadius: 5,
                      background: "var(--surface-3)",
                      color: "var(--ink-subtle)",
                      fontWeight: 600,
                    }}
                  >
                    固定
                  </span>
                )}
              </div>
              <span
                style={{
                  width: 64,
                  flex: "0 0 auto",
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "3px 8px",
                  borderRadius: 6,
                  background: "var(--surface-2)",
                  border: "1px solid var(--hairline)",
                  color: "var(--ink-muted)",
                  textAlign: "center",
                }}
              >
                {it.type === "select" ? "選択肢" : "値"}
              </span>
              <span
                style={{
                  flex: 1,
                  fontSize: 13,
                  color: "var(--ink-subtle)",
                  fontFamily: mono,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {detailLabel(it)}
              </span>
              <div style={{ display: "flex", gap: 4, flex: "0 0 auto" }}>
                <Hoverable as="button" title="編集" onClick={() => onEdit(it.id)} style={iconBtn} hoverStyle={iconBtnHover}>
                  <Icon name="edit" size={15} />
                </Hoverable>
                <Hoverable
                  as="button"
                  title="削除"
                  onClick={() => {
                    if (!it.locked) onDelete(it.id);
                  }}
                  style={it.locked ? delLocked : delNormal}
                  hoverStyle={it.locked ? undefined : { background: "var(--st-check-bg)", color: "#e5534b" }}
                >
                  <Icon name="trash" size={15} />
                </Hoverable>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
