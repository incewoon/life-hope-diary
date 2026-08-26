import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export const PEN_COLORS = [
  { name: "검정", value: "#1f2937" },
  { name: "LH 블루", value: "#0b6db7" },
  { name: "레드", value: "#d94848" },
] as const;

export const PEN_WIDTHS = [2, 4, 7] as const;

/** 형광펜: 노란 형광색 고정 + 반투명 */
export const HIGHLIGHTER_COLOR = "rgba(250, 214, 40, 0.38)";
export const HIGHLIGHTER_WIDTH = 22;

export type PenTool = "pen" | "eraser" | "text" | "highlighter";

export type TextSize = "sm" | "md" | "lg";

export const TEXT_SIZES: { key: TextSize; label: string; px: number }[] = [
  { key: "sm", label: "작게", px: 14 },
  { key: "md", label: "보통", px: 18 },
  { key: "lg", label: "크게", px: 24 },
];

interface PenState {
  tool: PenTool;
  color: string;
  width: number;
  textSize: TextSize;
  setTool: (t: PenTool) => void;
  setColor: (c: string) => void;
  setWidth: (w: number) => void;
  setTextSize: (s: TextSize) => void;
}

const PenContext = createContext<PenState | null>(null);

export function PenProvider({ children }: { children: ReactNode }) {
  const [tool, setTool] = useState<PenTool>("pen");
  const [color, setColor] = useState<string>(PEN_COLORS[0].value);
  const [width, setWidth] = useState<number>(PEN_WIDTHS[1]);
  const [textSize, setTextSize] = useState<TextSize>("md");

  const value = useMemo(
    () => ({ tool, color, width, textSize, setTool, setColor, setWidth, setTextSize }),
    [tool, color, width, textSize],
  );

  return <PenContext.Provider value={value}>{children}</PenContext.Provider>;
}

export function usePen(): PenState {
  const ctx = useContext(PenContext);
  if (!ctx) throw new Error("usePen must be used inside PenProvider");
  return ctx;
}
