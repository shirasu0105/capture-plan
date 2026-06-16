// Pure calculation/format helpers shared by client and server.
// Ported verbatim from the prototype to guarantee identical behaviour.

import type { ConditionItem, PlanRow } from "./types";

/** 表示値: 値形式は単位付き、選択肢はそのまま */
export function dispVal(
  item: ConditionItem | undefined,
  v: string | number,
): string {
  if (!item) return String(v);
  return item.type === "value" ? `${v}${item.unit || ""}` : String(v);
}

/**
 * 見積撮像時間[秒] = 投影枚数 × 露光時間[ms] × 撮像回数 ÷ 1000
 * proj/exp の水準が無い行は null (—) を返す。
 */
export function estSec(row: PlanRow): number | null {
  const proj = row.values["proj"];
  const exp = row.values["exp"];
  if (proj == null || exp == null) return null;
  return (Number(proj) * Number(exp) * row.count) / 1000;
}

/** 秒を「○秒 / ○分○秒 / ○時間○分」に整形 */
export function fmtDur(sec: number | null): string {
  if (sec == null) return "—";
  const s = Math.round(sec);
  if (s < 60) return s + "秒";
  if (s < 3600) {
    const m = Math.floor(s / 60);
    const r = s % 60;
    return m + "分" + (r ? r + "秒" : "");
  }
  const h = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  return h + "時間" + (mm ? mm + "分" : "");
}

/** "YYYY-MM-DD HH:mm" 形式の現在時刻ラベル */
export function nowLabel(d: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    d.getFullYear() +
    "-" +
    p(d.getMonth() + 1) +
    "-" +
    p(d.getDate()) +
    " " +
    p(d.getHours()) +
    ":" +
    p(d.getMinutes())
  );
}

export interface FactorSpec {
  condId: string;
  levels: Array<string | number>;
}

/** 全組み合わせ (デカルト積) を生成 */
export function cartesian(
  spec: FactorSpec[],
): Array<Array<[string, string | number]>> {
  let combos: Array<Array<[string, string | number]>> = [[]];
  spec.forEach((f) => {
    const next: Array<Array<[string, string | number]>> = [];
    combos.forEach((c) =>
      f.levels.forEach((v) => next.push(c.concat([[f.condId, v]]))),
    );
    combos = next;
  });
  return combos;
}

/** spec から行データ (values/count/status) を構築。id 採番は呼び出し側 */
export function buildRowValues(
  spec: FactorSpec[],
): Array<Record<string, string | number>> {
  return cartesian(spec).map((c) => {
    const values: Record<string, string | number> = {};
    c.forEach((p) => (values[p[0]] = p[1]));
    return values;
  });
}

/** 要項に含まれる、ある因子の出現水準を出現順で抽出 */
export function factorLevels(
  rows: PlanRow[],
  cid: string,
): Array<string | number> {
  const seen: string[] = [];
  const out: Array<string | number> = [];
  rows.forEach((r) => {
    const v = r.values[cid];
    if (v != null && seen.indexOf(String(v)) < 0) {
      seen.push(String(v));
      out.push(v);
    }
  });
  return out;
}
