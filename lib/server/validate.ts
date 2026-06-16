// Server-side validation for condition items (mirrors prototype saveItem()).
import type { ItemInput } from "./db";
import type { ItemType } from "../types";

export interface ValidItem {
  ok: true;
  value: ItemInput;
}
export interface InvalidItem {
  ok: false;
  err: string;
}

export function validateItem(body: unknown): ValidItem | InvalidItem {
  const b = (body ?? {}) as Record<string, unknown>;
  const name = String(b.name ?? "").trim();
  const type = b.type as ItemType;
  if (!name) return { ok: false, err: "条件名を入力してください" };
  if (type !== "select" && type !== "value") return { ok: false, err: "形式が不正です" };

  if (type === "select") {
    const options = Array.isArray(b.options)
      ? (b.options as unknown[]).map((o) => String(o ?? "").trim()).filter(Boolean)
      : [];
    if (!options.length) return { ok: false, err: "選択肢を1つ以上入力してください" };
    return { ok: true, value: { name, type, options } };
  }

  const min = Number(b.min);
  const max = Number(b.max);
  const step = Number(b.step);
  const unit = String(b.unit ?? "").trim();
  if ([min, max, step].some((n) => Number.isNaN(n)))
    return { ok: false, err: "最小値・最大値・刻み幅は数値で入力してください" };
  if (min >= max) return { ok: false, err: "最大値は最小値より大きくしてください" };
  if (step <= 0) return { ok: false, err: "刻み幅は0より大きい値にしてください" };
  return { ok: true, value: { name, type, min, max, step, unit } };
}
