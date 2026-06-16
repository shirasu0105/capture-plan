"use client";
import { useState, type CSSProperties } from "react";
import { Hoverable, FocusInput, FocusTextarea } from "../primitives";
import {
  sCard,
  sInput,
  sInputFocus,
  sTextarea,
  sBtnPrimary,
  sBtnPrimaryHover,
  sBtnSecondary,
  sBtnSecondaryHover,
  sGhost,
  sGhostHover,
  availHover,
  mono,
} from "@/lib/styles";
import { dispVal } from "@/lib/calc";
import type { ConditionItem, Draft, GeneratePlanInput } from "@/lib/types";

const STEPS: Array<[string, string]> = [
  ["1", "基本情報"],
  ["2", "条件・水準"],
  ["3", "確認"],
];

function initialDraft(): Draft {
  return { name: "", note: "", factorOrder: ["proj", "exp"], levels: { proj: [], exp: [] }, inputs: {} };
}

export function CreateWizard({
  items,
  onCancel,
  onGenerate,
}: {
  items: ConditionItem[];
  onCancel: () => void;
  onGenerate: (input: GeneratePlanInput) => Promise<void>;
}) {
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [busy, setBusy] = useState(false);

  const getItem = (id: string) => items.find((i) => i.id === id);

  // ----- draft mutations (ported from prototype) -----
  const toggleFactor = (id: string) => {
    const it = getItem(id);
    if (it?.locked) return;
    setDraft((d) => {
      const levels = { ...d.levels };
      let factorOrder: string[];
      if (d.factorOrder.includes(id)) {
        factorOrder = d.factorOrder.filter((x) => x !== id);
        delete levels[id];
      } else {
        factorOrder = d.factorOrder.concat([id]);
        levels[id] = [];
      }
      return { ...d, factorOrder, levels };
    });
  };
  const toggleSelectLevel = (cid: string, val: string) =>
    setDraft((d) => {
      const cur = (d.levels[cid] || []).slice();
      const i = cur.indexOf(val);
      if (i >= 0) cur.splice(i, 1);
      else cur.push(val);
      return { ...d, levels: { ...d.levels, [cid]: cur } };
    });
  const setValInput = (cid: string, value: string) =>
    setDraft((d) => ({ ...d, inputs: { ...d.inputs, [cid]: { value, err: "" } } }));
  const addValLevel = (cid: string) =>
    setDraft((d) => {
      const item = getItem(cid)!;
      const raw = ((d.inputs[cid] && d.inputs[cid].value) || "").trim();
      const num = Number(raw);
      let err = "";
      if (raw === "" || Number.isNaN(num)) err = "数値を入力してください";
      else if (num < item.min! || num > item.max!) err = "範囲は " + item.min + "〜" + item.max;
      else {
        const k = (num - item.min!) / item.step!;
        if (Math.abs(k - Math.round(k)) > 1e-9) err = item.step + "刻みで入力してください";
      }
      const cur = (d.levels[cid] || []).slice();
      if (!err && cur.indexOf(num) >= 0) err = "すでに追加されています";
      if (err) return { ...d, inputs: { ...d.inputs, [cid]: { value: raw, err } } };
      cur.push(num);
      cur.sort((a, b) => Number(a) - Number(b));
      return { ...d, levels: { ...d.levels, [cid]: cur }, inputs: { ...d.inputs, [cid]: { value: "", err: "" } } };
    });
  const removeValLevel = (cid: string, val: string | number) =>
    setDraft((d) => ({ ...d, levels: { ...d.levels, [cid]: (d.levels[cid] || []).filter((v) => v !== val) } }));

  // ----- derived -----
  const factorsWithLevels = draft.factorOrder.filter((id) => (draft.levels[id] || []).length);
  const comboCount = factorsWithLevels.reduce(
    (a, id) => a * draft.levels[id].length,
    factorsWithLevels.length ? 1 : 0,
  );
  const nameOk = !!draft.name.trim();
  const draftNameOr = draft.name.trim() || "無題のデータ取り要項";

  const generate = async () => {
    setBusy(true);
    try {
      await onGenerate({
        name: draft.name,
        note: draft.note,
        factorOrder: draft.factorOrder,
        levels: draft.levels,
      });
    } finally {
      setBusy(false);
    }
  };

  // ----- step indicator -----
  const dotOn: CSSProperties = {
    width: 22,
    height: 22,
    borderRadius: "50%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 600,
    fontFamily: mono,
    background: "var(--primary)",
    color: "#fff",
  };
  const dotOff: CSSProperties = { ...dotOn, background: "var(--surface-3)", color: "var(--ink-subtle)" };

  const h2: CSSProperties = {
    margin: "0 0 6px",
    fontSize: 26,
    fontWeight: 600,
    letterSpacing: "-0.02em",
    color: "var(--ink)",
  };
  const lead: CSSProperties = { margin: "0 0 28px", fontSize: 15, color: "var(--ink-subtle)" };
  const fieldLabel: CSSProperties = {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "var(--ink-muted)",
    marginBottom: 8,
  };

  return (
    <div data-screen-label="要項作成" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* header */}
      <div
        style={{
          padding: "22px 48px",
          borderBottom: "1px solid var(--hairline)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 20,
          flex: "0 0 auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Hoverable as="button" onClick={onCancel} style={sGhost} hoverStyle={sGhostHover}>
            ← 一覧へ
          </Hoverable>
          <div style={{ width: 1, height: 18, background: "var(--hairline)" }} />
          <span style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>データ取り要項を作成</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {STEPS.map((st, i) => {
            const n = i + 1;
            const on = step >= n;
            return (
              <div key={st[0]} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={on ? dotOn : dotOff}>{st[0]}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: on ? "var(--ink)" : "var(--ink-subtle)" }}>
                  {st[1]}
                </span>
                {i < 2 && (
                  <span
                    style={{ width: 26, height: 1, background: "var(--hairline-strong)", margin: "0 4px", display: "inline-block" }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* body */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {step === 1 && (
          <div style={{ maxWidth: 680, margin: "0 auto", padding: 48 }}>
            <h2 style={{ ...h2 }}>基本情報</h2>
            <p style={{ margin: "0 0 32px", fontSize: 15, color: "var(--ink-subtle)" }}>
              この要項を識別する計画名と、作業上の注意事項を入力します。
            </p>
            <label style={fieldLabel}>
              計画名 <span style={{ color: "var(--primary)" }}>*</span>
            </label>
            <FocusInput
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              placeholder="例：基板はんだ接合部 学習データ 第2弾"
              style={sInput}
              focusStyle={sInputFocus}
            />
            <label style={{ ...fieldLabel, margin: "26px 0 8px" }}>
              注意事項 <span style={{ fontWeight: 400, color: "var(--ink-tertiary)" }}>（任意）</span>
            </label>
            <FocusTextarea
              value={draft.note}
              onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
              placeholder="作業上の注意、確認事項、依頼内容などを記入"
              style={sTextarea}
              focusStyle={sInputFocus}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 34 }}>
              <Hoverable
                as="button"
                onClick={() => nameOk && setStep(2)}
                style={{ ...sBtnPrimary, ...(nameOk ? {} : { opacity: 0.45, pointerEvents: "none" }) }}
                hoverStyle={sBtnPrimaryHover}
              >
                条件・水準を設定 →
              </Hoverable>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ maxWidth: 1080, margin: "0 auto", padding: "40px 48px 120px" }}>
            <h2 style={{ ...h2 }}>条件・水準の設定</h2>
            <p style={lead}>
              使用する条件項目（因子）を選び、それぞれの水準を入力します。投影枚数・露光時間は見積時間の算出に使われます。
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 24, alignItems: "start" }}>
              {/* left: factor picker */}
              <div style={{ ...sCard, padding: 8, position: "sticky", top: 0 }}>
                <div
                  style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", color: "var(--ink-tertiary)", padding: "10px 12px 8px" }}
                >
                  条件項目を選択
                </div>
                {items.map((it) => {
                  const on = draft.factorOrder.includes(it.id);
                  const locked = !!it.locked;
                  const typeLabel =
                    (it.type === "select" ? "選択肢" : "値 " + (it.unit ? "(" + it.unit + ")" : "")) +
                    (locked ? " ・必須" : "");
                  return (
                    <Hoverable
                      key={it.id}
                      as="button"
                      onClick={() => !locked && toggleFactor(it.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: 8,
                        border: "none",
                        cursor: locked ? "default" : "pointer",
                        background: on ? "var(--surface-2)" : "transparent",
                        textAlign: "left",
                        color: on ? "var(--ink)" : "var(--ink-muted)",
                      }}
                      hoverStyle={on ? undefined : availHover}
                    >
                      <span
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 5,
                          flex: "0 0 auto",
                          border: on ? "none" : "1.5px solid var(--hairline-strong)",
                          background: on ? (locked ? "var(--ink-tertiary)" : "var(--primary)") : "transparent",
                          color: "#fff",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {on ? "✓" : ""}
                      </span>
                      <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.2, textAlign: "left", minWidth: 0 }}>
                        <span style={{ fontSize: 14, fontWeight: 500 }}>{it.name}</span>
                        <span style={{ fontSize: 11, color: "var(--ink-subtle)" }}>{typeLabel}</span>
                      </span>
                    </Hoverable>
                  );
                })}
              </div>

              {/* right: per-factor level input */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {draft.factorOrder.length === 0 && (
                  <div style={{ ...sCard, padding: 48, textAlign: "center", color: "var(--ink-subtle)", fontSize: 14 }}>
                    左の一覧から条件項目を選択してください。
                  </div>
                )}
                {draft.factorOrder.map((id) => {
                  const it = getItem(id)!;
                  const lv = draft.levels[id] || [];
                  const inp = draft.inputs[id] || { value: "", err: "" };
                  const hint =
                    it.type === "value"
                      ? "範囲 " + it.min + "〜" + it.max + " / " + it.step + "刻み" + (it.unit ? " / " + it.unit : "")
                      : "";
                  return (
                    <div key={id} style={{ ...sCard, padding: "20px 22px" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
                          <span style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", whiteSpace: "nowrap" }}>{it.name}</span>
                          <span
                            style={{
                              fontSize: 12,
                              color: "var(--ink-subtle)",
                              fontFamily: mono,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {hint}
                          </span>
                        </div>
                        <span style={{ fontSize: 12, color: "var(--ink-subtle)", fontFamily: mono, whiteSpace: "nowrap", flex: "0 0 auto", paddingTop: 2 }}>
                          {lv.length} 水準
                        </span>
                      </div>

                      {it.type === "select" && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {(it.options || []).map((o) => {
                            const on = lv.includes(o);
                            return (
                              <button
                                key={o}
                                onClick={() => toggleSelectLevel(id, o)}
                                style={{
                                  padding: "7px 13px",
                                  borderRadius: 8,
                                  cursor: "pointer",
                                  fontSize: 13,
                                  fontWeight: 500,
                                  fontFamily: mono,
                                  border: on ? "1px solid var(--primary)" : "1px solid var(--hairline-strong)",
                                  background: on ? "rgba(94,106,210,0.14)" : "var(--surface-1)",
                                  color: on ? "var(--primary)" : "var(--ink-muted)",
                                }}
                              >
                                {o}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {it.type === "value" && (
                        <div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                            {lv.map((v) => (
                              <span
                                key={String(v)}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 7,
                                  padding: "6px 8px 6px 12px",
                                  borderRadius: 8,
                                  background: "var(--surface-2)",
                                  border: "1px solid var(--hairline-strong)",
                                  fontSize: 13,
                                  fontWeight: 500,
                                  fontFamily: mono,
                                  color: "var(--ink)",
                                }}
                              >
                                {v}
                                {it.unit || ""}
                                <button
                                  onClick={() => removeValLevel(id, v)}
                                  style={{ border: "none", background: "transparent", color: "var(--ink-subtle)", cursor: "pointer", fontSize: 14, lineHeight: 1, padding: "0 2px" }}
                                >
                                  ✕
                                </button>
                              </span>
                            ))}
                            {lv.length === 0 && (
                              <span style={{ fontSize: 13, color: "var(--ink-tertiary)", padding: "6px 0" }}>水準が未入力です</span>
                            )}
                          </div>
                          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                            <FocusInput
                              value={inp.value}
                              onChange={(e) => setValInput(id, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  addValLevel(id);
                                }
                              }}
                              placeholder={it.min + "〜" + it.max + " / " + it.step + "刻み"}
                              style={{ ...sInput, maxWidth: 220, fontFamily: mono }}
                              focusStyle={sInputFocus}
                            />
                            <Hoverable as="button" onClick={() => addValLevel(id)} style={sBtnSecondary} hoverStyle={sBtnSecondaryHover}>
                              追加
                            </Hoverable>
                          </div>
                          {inp.err && <div style={{ fontSize: 12, color: "#e5534b", marginTop: 8 }}>{inp.err}</div>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ maxWidth: 760, margin: "0 auto", padding: 48 }}>
            <h2 style={{ ...h2 }}>確認して生成</h2>
            <p style={lead}>内容を確認し、条件組み合わせ表を生成します。生成後も不要な行は削除できます。</p>
            <div style={{ ...sCard, padding: 26, marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", color: "var(--ink-tertiary)", marginBottom: 6 }}>計画名</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: "var(--ink)", marginBottom: draft.note.trim() ? 18 : 0 }}>{draftNameOr}</div>
              {draft.note.trim() && (
                <>
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", color: "var(--ink-tertiary)", marginBottom: 6 }}>注意事項</div>
                  <div style={{ fontSize: 14, color: "var(--ink-muted)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{draft.note}</div>
                </>
              )}
            </div>
            <div style={{ ...sCard, padding: "8px 22px", marginBottom: 24 }}>
              {factorsWithLevels.map((id) => {
                const it = getItem(id)!;
                return (
                  <div key={id} style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: "14px 0", borderBottom: "1px solid var(--hairline)" }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", width: 120, flex: "0 0 auto" }}>{it.name}</span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {draft.levels[id].map((v) => (
                        <span
                          key={String(v)}
                          style={{ padding: "3px 9px", borderRadius: 6, background: "var(--surface-2)", border: "1px solid var(--hairline)", fontSize: 12, fontFamily: mono, color: "var(--ink-muted)" }}
                        >
                          {dispVal(it, v)}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0 14px" }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>合計行数</span>
                <span style={{ fontSize: 20, fontWeight: 600, fontFamily: mono, color: "var(--primary)" }}>{comboCount.toLocaleString("en-US")} 行</span>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Hoverable as="button" onClick={() => setStep(2)} style={sBtnSecondary} hoverStyle={sBtnSecondaryHover}>
                ← 戻る
              </Hoverable>
              <Hoverable
                as="button"
                onClick={generate}
                style={{ ...sBtnPrimary, ...(busy ? { opacity: 0.6, pointerEvents: "none" } : {}) }}
                hoverStyle={sBtnPrimaryHover}
              >
                ✓&nbsp;組み合わせ表を生成
              </Hoverable>
            </div>
          </div>
        )}
      </div>

      {/* step 2 sticky footer */}
      {step === 2 && (
        <div
          style={{
            flex: "0 0 auto",
            borderTop: "1px solid var(--hairline)",
            background: "var(--surface-1)",
            padding: "16px 48px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontSize: 13, color: "var(--ink-subtle)" }}>生成される組み合わせ</span>
            <span style={{ fontSize: 24, fontWeight: 600, fontFamily: mono, color: "var(--ink)" }}>{comboCount.toLocaleString("en-US")}</span>
            <span style={{ fontSize: 13, color: "var(--ink-subtle)" }}>行</span>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Hoverable as="button" onClick={() => setStep(1)} style={sBtnSecondary} hoverStyle={sBtnSecondaryHover}>
              ← 戻る
            </Hoverable>
            <Hoverable
              as="button"
              onClick={() => factorsWithLevels.length > 0 && setStep(3)}
              style={{ ...sBtnPrimary, ...(factorsWithLevels.length > 0 ? {} : { opacity: 0.45, pointerEvents: "none" }) }}
              hoverStyle={sBtnPrimaryHover}
            >
              確認へ →
            </Hoverable>
          </div>
        </div>
      )}
    </div>
  );
}
