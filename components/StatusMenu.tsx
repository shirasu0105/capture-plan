"use client";
import { Hoverable } from "./primitives";
import { Icon, StatusGlyph } from "./icons";
import { menuItemHover } from "@/lib/styles";
import { SM } from "@/lib/theme";
import type { Status } from "@/lib/types";

const ORDER: Status[] = ["todo", "done", "check"];

export function StatusMenu({
  pos,
  current,
  onSelect,
  onClose,
}: {
  pos: { top: number; right: number };
  current: Status;
  onSelect: (s: Status) => void;
  onClose: () => void;
}) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 40 }}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "fixed",
          top: pos.top,
          right: pos.right,
          zIndex: 41,
          minWidth: 150,
          background: "var(--surface-1)",
          border: "1px solid var(--hairline-strong)",
          borderRadius: 9,
          boxShadow: "0 12px 32px var(--overlay)",
          padding: 4,
        }}
      >
        {ORDER.map((k) => (
          <Hoverable
            key={k}
            as="button"
            onClick={() => onSelect(k)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              width: "100%",
              padding: "8px 10px",
              borderRadius: 6,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: 13,
              color: "var(--ink)",
            }}
            hoverStyle={menuItemHover}
          >
            <span style={{ display: "flex", flex: "0 0 auto" }}>
              <StatusGlyph status={k} size={15} />
            </span>
            <span style={{ flex: 1, textAlign: "left", whiteSpace: "nowrap" }}>{SM[k].label}</span>
            {current === k && (
              <span style={{ color: "var(--primary)", display: "flex" }}>
                <Icon name="check" size={14} sw={2.2} />
              </span>
            )}
          </Hoverable>
        ))}
      </div>
    </div>
  );
}
