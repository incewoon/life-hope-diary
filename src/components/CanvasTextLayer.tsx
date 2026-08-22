import { useEffect, useRef } from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { TEXT_SIZES, type TextSize } from "@/lib/pen-context";

export interface TextBox {
  id: string;
  /** baseWidth 기준 정규화 좌표 */
  x: number;
  y: number;
  text: string;
  size: TextSize;
  color: string;
}

/** 새 상자 기본 시작 위치 (왼쪽 상단 여백) */
export const TEXT_START_X = 0.03;
export const TEXT_START_Y = 0.03;

export function parseTextBoxes(raw: string | undefined): TextBox[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (b): b is TextBox =>
        !!b && typeof b === "object" && typeof (b as TextBox).id === "string",
    );
  } catch {
    return [];
  }
}

/** 왼쪽 상단에서 시작하되 기존 상자와 겹치지 않는 가장 위쪽 여백을 찾습니다. */
export function nextTextPosition(boxes: TextBox[]): { x: number; y: number } {
  const step = 0.035;
  let y = TEXT_START_Y;
  const near = (a: number, b: number) => Math.abs(a - b) < step * 0.8;
  // eslint-disable-next-line no-constant-condition
  while (boxes.some((b) => near(b.x, TEXT_START_X) && near(b.y, y))) {
    y += step;
  }
  return { x: TEXT_START_X, y };
}

export function textSizePx(size: TextSize): number {
  return TEXT_SIZES.find((s) => s.key === size)?.px ?? 18;
}

interface Props {
  boxes: TextBox[];
  onChange: (boxes: TextBox[]) => void;
  /** 정규화 좌표 → px 변환 기준 폭 */
  scale: number;
  active: boolean;
  focusId?: string | null;
  onFocused?: () => void;
}

export function CanvasTextLayer({ boxes, onChange, scale, active, focusId, onFocused }: Props) {
  const dragRef = useRef<{ id: string; dx: number; dy: number } | null>(null);
  const focusRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (focusId && focusRef.current) {
      focusRef.current.focus();
      onFocused?.();
    }
  }, [focusId, onFocused]);

  const update = (id: string, patch: Partial<TextBox>) =>
    onChange(boxes.map((b) => (b.id === id ? { ...b, ...patch } : b)));

  return (
    <div
      className={cn(
        "absolute inset-0 z-10",
        active ? "pointer-events-none" : "pointer-events-none",
      )}
    >
      {boxes.map((box) => (
        <div
          key={box.id}
          className={cn(
            "absolute flex items-start gap-1",
            active ? "pointer-events-auto" : "pointer-events-none",
          )}
          style={{ left: box.x * scale, top: box.y * scale, maxWidth: scale * 0.9 }}
        >
          <span
            aria-label="이동"
            onPointerDown={(e) => {
              if (!active) return;
              e.currentTarget.setPointerCapture(e.pointerId);
              dragRef.current = {
                id: box.id,
                dx: e.clientX - box.x * scale,
                dy: e.clientY - box.y * scale,
              };
            }}
            onPointerMove={(e) => {
              const d = dragRef.current;
              if (!d || d.id !== box.id) return;
              update(box.id, {
                x: Math.max(0, (e.clientX - d.dx) / scale),
                y: Math.max(0, (e.clientY - d.dy) / scale),
              });
            }}
            onPointerUp={() => {
              dragRef.current = null;
            }}
            className={cn(
              "mt-1 h-5 w-2 shrink-0 cursor-move rounded-full bg-border touch-none",
              active ? "opacity-100" : "opacity-0",
            )}
          />
          <textarea
            ref={focusId === box.id ? focusRef : undefined}
            value={box.text}
            readOnly={!active}
            placeholder="텍스트 입력"
            onChange={(e) => {
              update(box.id, { text: e.target.value });
              e.target.style.height = "auto";
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            rows={1}
            className={cn(
              "min-w-[8rem] resize-none overflow-hidden rounded-md border bg-transparent px-1.5 py-0.5 leading-snug outline-none",
              active ? "border-border/80 bg-card/70 focus:border-primary" : "border-transparent",
            )}
            style={{ color: box.color, fontSize: textSizePx(box.size) }}
          />
          {active ? (
            <button
              type="button"
              aria-label="텍스트 삭제"
              onClick={() => onChange(boxes.filter((b) => b.id !== box.id))}
              className="mt-1 rounded-md p-0.5 text-muted-foreground hover:text-destructive"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}
