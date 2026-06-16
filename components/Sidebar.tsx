"use client";
import type { CSSProperties } from "react";
import { Hoverable } from "./primitives";
import { Icon } from "./icons";
import type { ThemeName } from "@/lib/theme";
import { mono } from "@/lib/styles";

type View = "list" | "create" | "plan" | "settings";

const navBase: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  width: "100%",
  height: "34px",
  padding: "0 10px",
  borderRadius: "8px",
  border: "none",
  background: "transparent",
  color: "var(--ink-subtle)",
  fontSize: "13.5px",
  fontWeight: 500,
  letterSpacing: "-0.01em",
  cursor: "pointer",
  textAlign: "left",
  transition: "background .12s, color .12s",
};
const navOn: CSSProperties = {
  ...navBase,
  background: "var(--surface-3)",
  color: "var(--ink)",
  fontWeight: 600,
};
const navHover: CSSProperties = { background: "var(--surface-2)", color: "var(--ink-muted)" };

const quickAddStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "7px",
  width: "100%",
  justifyContent: "flex-start",
  height: "32px",
  padding: "0 13px",
  borderRadius: "8px",
  border: "1px solid var(--hairline)",
  background: "var(--surface-2)",
  color: "var(--ink)",
  fontSize: "13.5px",
  fontWeight: 500,
  letterSpacing: "-0.01em",
  cursor: "pointer",
};
const quickAddHover: CSSProperties = {
  background: "var(--surface-hover)",
  border: "1px solid var(--hairline-strong)",
};

const themeBtnStyle: CSSProperties = {
  width: "32px",
  height: "32px",
  padding: 0,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "none",
  borderRadius: "8px",
  background: "transparent",
  color: "var(--ink-subtle)",
  cursor: "pointer",
  flex: "0 0 auto",
};
const themeBtnHover: CSSProperties = { background: "var(--surface-2)", color: "var(--ink)" };

export function Sidebar({
  view,
  theme,
  planCount,
  onCreate,
  onList,
  onSettings,
  onToggleTheme,
}: {
  view: View;
  theme: ThemeName;
  planCount: number;
  onCreate: () => void;
  onList: () => void;
  onSettings: () => void;
  onToggleTheme: () => void;
}) {
  const listActive = view === "list";
  const settingsActive = view === "settings";
  const settingsBtnStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    width: "100%",
    flex: 1,
    height: "28px",
    padding: "0 10px",
    borderRadius: "8px",
    border: "none",
    background: settingsActive ? "var(--surface-3)" : "transparent",
    color: settingsActive ? "var(--ink)" : "var(--ink-muted)",
    fontSize: "12.5px",
    fontWeight: settingsActive ? 600 : 500,
    letterSpacing: "-0.01em",
    cursor: "pointer",
    textAlign: "left",
  };

  return (
    <aside
      style={{
        width: 248,
        flex: "0 0 248px",
        borderRight: "1px solid var(--hairline)",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "var(--sidebar-bg)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 14px 10px" }}>
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 8,
            background: "var(--primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flex: "0 0 auto",
          }}
        >
          <svg width="17" height="17" viewBox="0 0 28 28">
            <path d="M9 8.5h10M9 14h10M9 19.5h6" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" />
          </svg>
        </div>
        <div style={{ lineHeight: 1.1 }}>
          <div style={{ fontSize: "14.5px", fontWeight: 700, letterSpacing: "-0.03em", color: "var(--ink)" }}>
            CapturePlan
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-tertiary)" }}>X線データ取り要項</div>
        </div>
      </div>

      <div style={{ padding: "4px 12px 10px" }}>
        <Hoverable as="button" onClick={onCreate} style={quickAddStyle} hoverStyle={quickAddHover}>
          <Icon name="plus" size={15} sw={2} />
          <span>新規作成</span>
        </Hoverable>
      </div>

      <nav style={{ padding: "0 8px", overflowY: "auto", flex: 1 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Hoverable
            as="button"
            onClick={onList}
            style={listActive ? navOn : navBase}
            hoverStyle={listActive ? undefined : navHover}
          >
            <span style={{ color: listActive ? "var(--primary)" : "inherit", display: "flex" }}>
              <Icon name="list" size={17} />
            </span>
            <span style={{ flex: 1 }}>データ取り要項</span>
            <span style={{ fontFamily: mono, fontSize: 11, color: "var(--ink-tertiary)" }}>{planCount}</span>
          </Hoverable>
        </div>
      </nav>

      <div
        style={{
          padding: 10,
          borderTop: "1px solid var(--hairline)",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <Hoverable
          as="button"
          onClick={onSettings}
          style={settingsBtnStyle}
          hoverStyle={settingsActive ? undefined : { background: "var(--surface-2)", color: "var(--ink)" }}
        >
          <span style={{ color: settingsActive ? "var(--primary)" : "inherit", display: "flex" }}>
            <Icon name="gear" size={15} />
          </span>
          <span style={{ flex: 1, textAlign: "left" }}>設定</span>
        </Hoverable>
        <Hoverable
          as="button"
          onClick={onToggleTheme}
          title={theme === "dark" ? "ライトに切替" : "ダークに切替"}
          style={themeBtnStyle}
          hoverStyle={themeBtnHover}
        >
          <Icon name={theme === "dark" ? "sun" : "moon"} size={16} />
        </Hoverable>
      </div>
    </aside>
  );
}
