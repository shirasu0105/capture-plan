"use client";
import type { CSSProperties } from "react";
import { Hoverable } from "./primitives";
import { Icon } from "./icons";
import { topbarActionStyle, topbarActionHover } from "@/lib/styles";

type View = "list" | "plan" | "settings";

const crumbLast: CSSProperties = {
  fontSize: "15px",
  fontWeight: 600,
  color: "var(--ink)",
  letterSpacing: "-0.02em",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  minWidth: 0,
  flex: "0 1 auto",
};
const crumbLink: CSSProperties = {
  fontSize: "13px",
  fontWeight: 500,
  color: "var(--ink-subtle)",
  cursor: "pointer",
  whiteSpace: "nowrap",
  flex: "0 0 auto",
};

export function Topbar({
  view,
  planName,
  onList,
  onAddItem,
}: {
  view: View;
  planName?: string;
  onList: () => void;
  onAddItem: () => void;
}) {
  return (
    <div
      style={{
        height: 56,
        flex: "0 0 auto",
        borderBottom: "1px solid var(--hairline)",
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "0 24px",
        background: "var(--canvas)",
      }}
    >
      <span style={{ color: "var(--ink-subtle)", display: "flex", flex: "0 0 auto" }}>
        <Icon name={view === "list" ? "list" : view === "settings" ? "gear" : "doc"} size={18} />
      </span>

      {view === "list" && <span style={crumbLast}>データ取り要項</span>}
      {view === "settings" && <span style={crumbLast}>設定</span>}
      {view === "plan" && (
        <>
          <span style={crumbLink} onClick={onList}>
            データ取り要項
          </span>
          <span style={{ color: "var(--ink-tertiary)", display: "flex" }}>
            <Icon name="chevron" size={14} />
          </span>
          <span style={crumbLast}>{planName}</span>
        </>
      )}

      <div style={{ flex: 1 }} />

      {view === "settings" && (
        <Hoverable as="button" onClick={onAddItem} style={topbarActionStyle} hoverStyle={topbarActionHover}>
          <span style={{ color: "var(--ink-subtle)", display: "flex" }}>
            <Icon name="plus" size={15} sw={2} />
          </span>
          <span>条件項目を追加</span>
        </Hoverable>
      )}
    </div>
  );
}
