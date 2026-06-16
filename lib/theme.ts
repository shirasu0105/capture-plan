// Theme tokens ported verbatim from the prototype (Linear-inspired).
// Applied as inline CSS custom properties on the app shell so the entire
// component tree can reference them via var(--token), exactly like the proto.

import type { Status } from "./types";

export type ThemeName = "dark" | "light";

export type Palette = Record<string, string>;

export const PAL: Record<ThemeName, Palette> = {
  dark: {
    "--canvas": "#08090a",
    "--surface-1": "#0f1011",
    "--surface-2": "#141516",
    "--surface-3": "#1a1b1d",
    "--surface-hover": "#1c1d1f",
    "--sidebar-bg": "#0b0c0d",
    "--hairline": "#23252a",
    "--hairline-strong": "#34343a",
    "--ink": "#f7f8f8",
    "--ink-muted": "#d0d6e0",
    "--ink-subtle": "#8a8f98",
    "--ink-tertiary": "#62666d",
    "--primary": "#5e6ad2",
    "--primary-hover": "#828fff",
    "--on-primary": "#ffffff",
    "--st-todo": "#8a8f98",
    "--st-todo-bg": "rgba(138,143,152,0.15)",
    "--st-done": "#27a644",
    "--st-done-bg": "rgba(39,166,68,0.16)",
    "--st-check": "#f2c94c",
    "--st-check-bg": "rgba(242,201,76,0.15)",
    "--overlay": "rgba(0,0,0,0.6)",
    "--shadow": "0 1px 2px rgba(0,0,0,0.4)",
  },
  light: {
    "--canvas": "#fbfbfb",
    "--surface-1": "#ffffff",
    "--surface-2": "#f5f6f7",
    "--surface-3": "#eef0f1",
    "--surface-hover": "#f1f2f4",
    "--sidebar-bg": "#f6f6f7",
    "--hairline": "#e8e9eb",
    "--hairline-strong": "#d7d9dc",
    "--ink": "#16181c",
    "--ink-muted": "#3a3f47",
    "--ink-subtle": "#6a7079",
    "--ink-tertiary": "#9aa0a8",
    "--primary": "#5e6ad2",
    "--primary-hover": "#828fff",
    "--on-primary": "#ffffff",
    "--st-todo": "#8a8f98",
    "--st-todo-bg": "rgba(138,143,152,0.14)",
    "--st-done": "#27a644",
    "--st-done-bg": "rgba(39,166,68,0.13)",
    "--st-check": "#b8860b",
    "--st-check-bg": "rgba(184,134,11,0.13)",
    "--overlay": "rgba(20,22,28,0.32)",
    "--shadow": "0 1px 2px rgba(16,18,33,0.08)",
  },
};

/** ステータスのラベルと色トークン */
export const SM: Record<Status, { label: string; var: string; bg: string }> = {
  todo: { label: "未着手", var: "--st-todo", bg: "--st-todo-bg" },
  done: { label: "撮像済み", var: "--st-done", bg: "--st-done-bg" },
  check: { label: "要確認", var: "--st-check", bg: "--st-check-bg" },
};
