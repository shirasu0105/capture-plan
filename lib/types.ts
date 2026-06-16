// Shared domain types for CapturePlan.
// Mirrors the data model of the prototype (docs/design/capture-plan).

export type ItemType = "select" | "value";

/** ステータス: 未着手 / 撮像済み / 要確認 */
export type Status = "todo" | "done" | "check";

/** 条件項目 (アプリ設定で定義する撮像条件) */
export interface ConditionItem {
  id: string;
  name: string;
  type: ItemType;
  /** type === "select" の候補値 */
  options?: string[];
  /** type === "value" の範囲・刻み・単位 */
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  /** 投影枚数・露光時間は削除/トグル不可 */
  locked?: boolean;
}

/** 条件組み合わせ表の 1 行 (= 撮像対象) */
export interface PlanRow {
  id: string;
  /** condId -> 水準値 (string | number) */
  values: Record<string, string | number>;
  /** 撮像回数 (初期値 1) */
  count: number;
  status: Status;
}

/** データ取り要項 */
export interface Plan {
  id: string;
  name: string;
  note: string;
  /** 因子の並び順 (= 表の列順) */
  factorOrder: string[];
  createdLabel: string;
  updatedLabel: string;
  rows: PlanRow[];
}

/** 一覧用の軽量サマリ (rows を含まない) */
export interface PlanSummary {
  id: string;
  name: string;
  note: string;
  factorOrder: string[];
  createdLabel: string;
  updatedLabel: string;
  totalCount: number;
  doneCount: number;
  checkCount: number;
}

/** 要項作成ウィザードのドラフト (クライアント保持) */
export interface Draft {
  name: string;
  note: string;
  factorOrder: string[];
  /** condId -> 選択された水準 */
  levels: Record<string, Array<string | number>>;
  /** 値形式の入力中バッファ condId -> {value, err} */
  inputs: Record<string, { value: string; err: string }>;
}

/** 要項生成リクエストのペイロード */
export interface GeneratePlanInput {
  name: string;
  note: string;
  factorOrder: string[];
  levels: Record<string, Array<string | number>>;
}
