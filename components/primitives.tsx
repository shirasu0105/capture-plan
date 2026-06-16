"use client";
// Reusable primitives that replicate the prototype's `style-hover` / `style-focus`
// directives by merging extra style objects on hover / focus state.
import React, { useState, type CSSProperties } from "react";

type Props = React.HTMLAttributes<HTMLElement> & {
  as?: keyof React.JSX.IntrinsicElements;
  style?: CSSProperties;
  hoverStyle?: CSSProperties;
  focusStyle?: CSSProperties;
  title?: string;
  draggable?: boolean;
  onDragStart?: React.DragEventHandler;
  onDragOver?: React.DragEventHandler;
  onDrop?: React.DragEventHandler;
  onDragEnd?: React.DragEventHandler;
};

/** Polymorphic element with hover (and optional focus) style merging. */
export function Hoverable({
  as = "div",
  style,
  hoverStyle,
  focusStyle,
  children,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  ...rest
}: Props) {
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const merged: CSSProperties = {
    ...style,
    ...(hover && hoverStyle ? hoverStyle : {}),
    ...(focus && focusStyle ? focusStyle : {}),
  };
  return React.createElement(
    as,
    {
      ...rest,
      style: merged,
      onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
        if (hoverStyle) setHover(true);
        onMouseEnter?.(e);
      },
      onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
        if (hoverStyle) setHover(false);
        onMouseLeave?.(e);
      },
      onFocus: (e: React.FocusEvent<HTMLElement>) => {
        if (focusStyle) setFocus(true);
        onFocus?.(e);
      },
      onBlur: (e: React.FocusEvent<HTMLElement>) => {
        if (focusStyle) setFocus(false);
        onBlur?.(e);
      },
    },
    children,
  );
}

type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "style"> & {
  style?: CSSProperties;
  focusStyle?: CSSProperties;
};
export function FocusInput({ style, focusStyle, onFocus, onBlur, ...rest }: InputProps) {
  const [f, setF] = useState(false);
  return (
    <input
      {...rest}
      style={{ ...style, ...(f && focusStyle ? focusStyle : {}) }}
      onFocus={(e) => {
        setF(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setF(false);
        onBlur?.(e);
      }}
    />
  );
}

type TextareaProps = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "style"> & {
  style?: CSSProperties;
  focusStyle?: CSSProperties;
};
export function FocusTextarea({ style, focusStyle, onFocus, onBlur, ...rest }: TextareaProps) {
  const [f, setF] = useState(false);
  return (
    <textarea
      {...rest}
      style={{ ...style, ...(f && focusStyle ? focusStyle : {}) }}
      onFocus={(e) => {
        setF(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setF(false);
        onBlur?.(e);
      }}
    />
  );
}
