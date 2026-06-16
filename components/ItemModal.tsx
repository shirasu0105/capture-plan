"use client";
import { useState, type CSSProperties } from "react";
import { Hoverable, FocusInput } from "./primitives";
import { Icon } from "./icons";
import {
  sBtnPrimary,
  sBtnPrimaryHover,
  sBtnSecondary,
  sBtnSecondaryHover,
  sInput,
  sInputFocus,
  delBtn,
  delBtnHover,
  addOptStyle,
  addOptHover,
} from "@/lib/styles";
import type { ConditionItem, ItemType } from "@/lib/types";
import type { ItemInput } from "@/lib/server/db";

export interface ItemModalState {
  mode: "add" | "edit";
  id?: string;
  /** 固定項目（投影枚数・露光時間）。名称・形式・単位は編集不可、min/max/step のみ編集可 */
  locked: boolean;
  data: {
    name: string;
    type: ItemType;
    options: string[];
    min: string;
    max: string;
    step: string;
    unit: string;
  };
}

export function emptyItemModal(): ItemModalState {
  return {
    mode: "add",
    locked: false,
    data: { name: "", type: "select", options: [""], min: "0", max: "100", step: "1", unit: "" },
  };
}

export function itemModalFromItem(it: ConditionItem): ItemModalState {
  return {
    mode: "edit",
    id: it.id,
    locked: !!it.locked,
    data: {
      name: it.name,
      type: it.type,
      options: it.options ? it.options.slice() : [""],
      min: String(it.min ?? 0),
      max: String(it.max ?? 100),
      step: String(it.step ?? 1),
      unit: it.unit ?? "",
    },
  };
}

const tb = (on: boolean): CSSProperties => ({
  flex: 1,
  padding: "9px 0",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 600,
  border: on ? "1px solid var(--primary)" : "1px solid var(--hairline-strong)",
  background: on ? "rgba(94,106,210,0.14)" : "var(--surface-1)",
  color: on ? "var(--primary)" : "var(--ink-muted)",
});

export function ItemModal({
  initial,
  onSave,
  onClose,
}: {
  initial: ItemModalState;
  onSave: (input: ItemInput) => Promise<void>;
  onClose: () => void;
}) {
  const [data, setData] = useState(initial.data);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const locked = initial.locked;

  const patch = (p: Partial<ItemModalState["data"]>) => {
    setData((d) => ({ ...d, ...p }));
    setErr("");
  };
  const setOption = (i: number, v: string) =>
    setData((d) => ({ ...d, options: d.options.map((o, k) => (k === i ? v : o)) }));
  const addOption = () => setData((d) => ({ ...d, options: d.options.concat([""]) }));
  const removeOption = (i: number) =>
    setData((d) => {
      const opts = d.options.filter((_, k) => k !== i);
      return { ...d, options: opts.length ? opts : [""] };
    });

  const save = async () => {
    const name = data.name.trim();
    if (!name) return setErr("条件名を入力してください");
    let input: ItemInput;
    if (data.type === "select") {
      const opts = data.options.map((o) => (o || "").trim()).filter(Boolean);
      if (!opts.length) return setErr("選択肢を1つ以上入力してください");
      input = { name, type: "select", options: opts };
    } else {
      const min = Number(data.min);
      const max = Number(data.max);
      const step = Number(data.step);
      const unit = data.unit.trim();
      if ([min, max, step].some((n) => Number.isNaN(n)))
        return setErr("最小値・最大値・刻み幅は数値で入力してください");
      if (min >= max) return setErr("最大値は最小値より大きくしてください");
      if (step <= 0) return setErr("刻み幅は0より大きい値にしてください");
      input = { name, type: "value", min, max, step, unit };
    }
    setBusy(true);
    try {
      await onSave(input);
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "保存に失敗しました");
    } finally {
      setBusy(false);
    }
  };

  const labelStyle: CSSProperties = {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "var(--ink-muted)",
    marginBottom: 8,
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
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
          width: 540,
          maxWidth: "100%",
          maxHeight: "90vh",
          overflow: "auto",
          background: "var(--surface-1)",
          border: "1px solid var(--hairline-strong)",
          borderRadius: 14,
          boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ padding: "22px 26px 18px", borderBottom: "1px solid var(--hairline)" }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em" }}>
            {initial.mode === "add" ? "条件項目を追加" : "条件項目を編集"}
          </h3>
        </div>

        <div style={{ padding: "24px 26px" }}>
          <label style={labelStyle}>
            条件名 {!locked && <span style={{ color: "var(--primary)" }}>*</span>}
          </label>
          {locked ? (
            <LockedBox value={data.name} />
          ) : (
            <FocusInput
              value={data.name}
              onChange={(e) => patch({ name: e.target.value })}
              placeholder="例：管電圧"
              style={sInput}
              focusStyle={sInputFocus}
            />
          )}

          <label style={{ ...labelStyle, margin: "22px 0 8px" }}>形式</label>
          {locked ? (
            <LockedBox value="値" />
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => patch({ type: "select" })} style={tb(data.type === "select")}>
                選択肢
              </button>
              <button onClick={() => patch({ type: "value" })} style={tb(data.type === "value")}>
                値
              </button>
            </div>
          )}

          {locked && (
            <p style={{ margin: "12px 0 0", fontSize: 12.5, lineHeight: 1.6, color: "var(--ink-subtle)" }}>
              この項目は見積時間の計算に使われるため、名称・形式・単位は変更できません。最小値・最大値・刻み幅のみ編集できます。
            </p>
          )}

          {!locked && data.type === "select" && (
            <div style={{ marginTop: 22 }}>
              <label style={{ ...labelStyle, marginBottom: 10 }}>選択肢</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {data.options.map((o, i) => (
                  <div key={i} style={{ display: "flex", gap: 8 }}>
                    <FocusInput
                      value={o}
                      onChange={(e) => setOption(i, e.target.value)}
                      placeholder="候補値"
                      style={sInput}
                      focusStyle={sInputFocus}
                    />
                    <Hoverable as="button" onClick={() => removeOption(i)} style={delBtn} hoverStyle={delBtnHover}>
                      ✕
                    </Hoverable>
                  </div>
                ))}
              </div>
              <Hoverable as="button" onClick={addOption} style={addOptStyle} hoverStyle={addOptHover}>
                <Icon name="plus" size={14} sw={2} />
                <span>候補値を追加</span>
              </Hoverable>
            </div>
          )}

          {data.type === "value" && (
            <div style={{ marginTop: 22, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <ValueField label="最小値" value={data.min} onChange={(v) => patch({ min: v })} />
              <ValueField label="最大値" value={data.max} onChange={(v) => patch({ max: v })} />
              <ValueField label="刻み幅" value={data.step} onChange={(v) => patch({ step: v })} />
              {locked ? (
                <ReadOnlyValueField label="単位" value={data.unit || "—"} />
              ) : (
                <ValueField label="単位" value={data.unit} onChange={(v) => patch({ unit: v })} placeholder="kV / ms など" />
              )}
            </div>
          )}

          {err && <div style={{ marginTop: 16, fontSize: 13, color: "#e5534b" }}>{err}</div>}
        </div>

        <div
          style={{
            padding: "16px 26px",
            borderTop: "1px solid var(--hairline)",
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
          }}
        >
          <Hoverable as="button" onClick={onClose} style={sBtnSecondary} hoverStyle={sBtnSecondaryHover}>
            キャンセル
          </Hoverable>
          <Hoverable
            as="button"
            onClick={save}
            style={{ ...sBtnPrimary, ...(busy ? { opacity: 0.6, pointerEvents: "none" } : {}) }}
            hoverStyle={sBtnPrimaryHover}
          >
            保存
          </Hoverable>
        </div>
      </div>
    </div>
  );
}

function ValueField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-muted)", marginBottom: 7 }}>
        {label}
      </label>
      <FocusInput
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={sInput}
        focusStyle={sInputFocus}
      />
    </div>
  );
}

const readOnlyBoxStyle: CSSProperties = {
  ...sInput,
  background: "var(--surface-2)",
  color: "var(--ink-muted)",
  cursor: "default",
};

/** 固定項目の読み取り専用フィールド（値 + 「固定」バッジ）。 */
function LockedBox({ value }: { value: string }) {
  return (
    <div style={{ ...readOnlyBoxStyle, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span>{value}</span>
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          padding: "1px 6px",
          borderRadius: 5,
          background: "var(--surface-3)",
          color: "var(--ink-subtle)",
        }}
      >
        固定
      </span>
    </div>
  );
}

/** ラベル付きの読み取り専用フィールド（単位など）。 */
function ReadOnlyValueField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-muted)", marginBottom: 7 }}>
        {label}
      </label>
      <div style={readOnlyBoxStyle}>{value}</div>
    </div>
  );
}
