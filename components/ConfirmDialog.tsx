"use client";
import { useState, type CSSProperties } from "react";
import { Hoverable } from "./primitives";
import { sBtnSecondary, sBtnSecondaryHover } from "@/lib/styles";

const dangerBtn: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#e5534b",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  padding: "10px 16px",
  fontSize: "14px",
  fontWeight: 600,
  cursor: "pointer",
  letterSpacing: "-0.01em",
  whiteSpace: "nowrap",
};
const dangerBtnHover: CSSProperties = { background: "#d0453d" };

/** 破壊的操作の確認ダイアログ（ItemModal と同系統のスタイル）。 */
export function ConfirmDialog({
  title,
  message,
  confirmLabel = "削除",
  cancelLabel = "キャンセル",
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}) {
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      onClick={busy ? undefined : onCancel}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "var(--overlay)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 420,
          maxWidth: "100%",
          background: "var(--surface-1)",
          border: "1px solid var(--hairline-strong)",
          borderRadius: 14,
          boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ padding: "22px 26px 8px" }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em" }}>
            {title}
          </h3>
          <p style={{ margin: "12px 0 0", fontSize: 14, lineHeight: 1.6, color: "var(--ink-subtle)" }}>{message}</p>
        </div>

        <div
          style={{
            padding: "18px 26px 20px",
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
          }}
        >
          <Hoverable
            as="button"
            onClick={busy ? undefined : onCancel}
            style={{ ...sBtnSecondary, ...(busy ? { opacity: 0.6, pointerEvents: "none" } : {}) }}
            hoverStyle={sBtnSecondaryHover}
          >
            {cancelLabel}
          </Hoverable>
          <Hoverable
            as="button"
            onClick={confirm}
            style={{ ...dangerBtn, ...(busy ? { opacity: 0.6, pointerEvents: "none" } : {}) }}
            hoverStyle={dangerBtnHover}
          >
            {confirmLabel}
          </Hoverable>
        </div>
      </div>
    </div>
  );
}
