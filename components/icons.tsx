"use client";
// SVG icon + status glyph set, ported from the prototype's ic()/statusGlyph().
import React, { type CSSProperties } from "react";
import type { Status } from "@/lib/types";
import { SM } from "@/lib/theme";

type Node = [string, Record<string, string | number>];

const PATHS: Record<string, Node[]> = {
  list: [["path", { d: "M4 6h16" }], ["path", { d: "M4 12h16" }], ["path", { d: "M4 18h10" }]],
  gear: [
    ["circle", { cx: 12, cy: 12, r: 3 }],
    ["path", { d: "M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" }],
  ],
  doc: [
    ["path", { d: "M5 3h9l5 5v13H5z" }],
    ["path", { d: "M14 3v5h5" }],
    ["path", { d: "M8 13h8" }],
    ["path", { d: "M8 17h5" }],
  ],
  plus: [["path", { d: "M12 5v14M5 12h14" }]],
  grip: [
    ["circle", { cx: 9, cy: 6, r: 1.05, fill: "currentColor", stroke: "none" }],
    ["circle", { cx: 15, cy: 6, r: 1.05, fill: "currentColor", stroke: "none" }],
    ["circle", { cx: 9, cy: 12, r: 1.05, fill: "currentColor", stroke: "none" }],
    ["circle", { cx: 15, cy: 12, r: 1.05, fill: "currentColor", stroke: "none" }],
    ["circle", { cx: 9, cy: 18, r: 1.05, fill: "currentColor", stroke: "none" }],
    ["circle", { cx: 15, cy: 18, r: 1.05, fill: "currentColor", stroke: "none" }],
  ],
  trash: [["path", { d: "M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" }]],
  edit: [["path", { d: "M4 20h4l10-10-4-4L4 16z" }], ["path", { d: "M13.5 6.5l4 4" }]],
  check: [["polyline", { points: "20 6 9 17 4 12" }]],
  chevron: [["polyline", { points: "9 6 15 12 9 18" }]],
  sun: [
    ["circle", { cx: 12, cy: 12, r: 4 }],
    ["path", { d: "M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" }],
  ],
  moon: [["path", { d: "M21 12.8A8.5 8.5 0 1 1 11.2 3a6.5 6.5 0 0 0 9.8 9.8z" }]],
};

export function Icon({
  name,
  size = 17,
  sw = 1.8,
  style,
}: {
  name: keyof typeof PATHS;
  size?: number;
  sw?: number;
  style?: CSSProperties;
}) {
  const kids = (PATHS[name] || PATHS.list).map((e, i) =>
    React.createElement(e[0], { key: i, ...e[1] }),
  );
  return React.createElement(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: sw,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      style: { display: "block", ...style },
    },
    kids,
  );
}

export function StatusGlyph({ status, size = 15 }: { status: Status; size?: number }) {
  const c = `var(${SM[status].var})`;
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 16 16",
    style: { display: "block", flex: "0 0 auto" } as CSSProperties,
  };
  if (status === "done")
    return (
      <svg {...common}>
        <circle cx={8} cy={8} r={7} fill={c} />
        <path
          d="M4.6 8.2 7 10.5l4.4-4.6"
          fill="none"
          stroke="#fff"
          strokeWidth={1.7}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  if (status === "check")
    return (
      <svg {...common}>
        <circle cx={8} cy={8} r={6.4} fill="none" stroke={c} strokeWidth={1.6} />
        <circle cx={8} cy={8} r={2.5} fill={c} />
      </svg>
    );
  return (
    <svg {...common}>
      <circle cx={8} cy={8} r={6.4} fill="none" stroke={c} strokeWidth={1.4} strokeDasharray="2.4 2.4" />
    </svg>
  );
}
