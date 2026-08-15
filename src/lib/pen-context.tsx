import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export const PEN_COLORS = [
  { name: "검정", value: "#1f2937" },
  { name: "LH 블루", value: "#0b6db7" },
  { name: "레드", value: "#d94848" },
] as const;

export const PEN_WIDTHS = [2, 4, 7] as const;

export type PenTool = "pen" | "eraser";

interface PenState {
  tool: PenTool;
  color: string;
  width: number;
  setTool: (t: PenTool) => void;
  setColor: (c: string) => void;
  setWidth: (w: number) => void;
}

const PenContext = createContext<PenState | null>(null);

export function PenProvider({ children }: { children: ReactNode }) {
  const [tool, setTool] = useState<PenTool>("pen");
  const [color, setColor] = useState<string>(PEN_COLORS[0].value);
  const [width, setWidth] = useState<number>(PEN_WIDTHS[1]);

  const value = useMemo(
    () => ({ tool, color, width, setTool, setColor, setWidth }),
    [tool, color, width],
  );

  return <PenContext.Provider value={value}>{children}</PenContext.Provider>;
}

export function usePen(): PenState {
  const ctx = useContext(PenContext);
  if (!ctx) throw new Error("usePen must be used inside PenProvider");
  return ctx;
}
