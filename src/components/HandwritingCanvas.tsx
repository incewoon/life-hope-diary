import { useCallback, useEffect, useRef, useState } from "react";
import getStroke from "perfect-freehand";
import {
  Eraser,
  Pen,
  Redo2,
  RotateCcw,
  Undo2,
  Check,
  Loader2,
  ChevronsDown,
  ChevronsUp,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { PEN_COLORS, PEN_WIDTHS, usePen } from "@/lib/pen-context";
import {
  appendStrokes,
  getPage,
  replaceStrokes,
  type PageType,
  type Stroke,
  type StrokePoint,
} from "@/lib/db";

/** 가로모드 기준 고정 필기판 설정 */
export interface FixedBoard {
  baseWidth: number;
  baseHeight: number;
  cols: number;
  rows: number;
  onChange: (cols: number, rows: number) => void;
}

export const MAX_BOARD_UNITS = 5;

interface Props {
  pageId: string;
  pageType: PageType;
  /** 모눈 배경 */
  grid?: boolean;
  className?: string | undefined;
  minHeight?: number;
  label?: string | undefined;
  /** 콘텐츠 위에 겹치는 전면 필기 레이어 (입력 필드가 없는 페이지 전용) */
  overlay?: boolean;
  /** 고정 크기 + 스크롤 + 늘리기 모드 */
  fixed?: FixedBoard | undefined;
}


const MAX_HISTORY = 20;

function strokePath(stroke: Stroke, w: number): string {
  const outline = getStroke(
    stroke.points.map((p) => [p.x * w, p.y * w, p.pressure]),
    { size: stroke.width, thinning: 0.5, smoothing: 0.5, streamline: 0.5 },
  ) as number[][];
  if (outline.length === 0) return "";
  const parts: string[] = [];
  for (let i = 0; i < outline.length; i++) {
    const cur = outline[i] as number[];
    const next = outline[(i + 1) % outline.length] as number[];
    const x0 = cur[0] ?? 0;
    const y0 = cur[1] ?? 0;
    const x1 = next[0] ?? 0;
    const y1 = next[1] ?? 0;
    if (i === 0) parts.push(`M ${x0.toFixed(2)},${y0.toFixed(2)}`);
    parts.push(
      `Q ${x0.toFixed(2)},${y0.toFixed(2)} ${((x0 + x1) / 2).toFixed(2)},${((y0 + y1) / 2).toFixed(2)}`,
    );
  }
  parts.push("Z");
  return parts.join(" ");
}


export function HandwritingCanvas({
  pageId,
  pageType,
  grid = false,
  className,
  minHeight = 320,
  label,
  overlay = false,
  fixed,
}: Props) {
  const { tool, color, width } = usePen();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const redoRef = useRef<Stroke[]>([]);
  const drawingRef = useRef<StrokePoint[] | null>(null);
  const activePointerRef = useRef<number | null>(null);
  const pendingRef = useRef<Stroke[]>([]);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sizeRef = useRef({ w: 0, h: 0, dpr: 0 });
  /** 좌표 정규화 기준 (고정 모드에서는 baseWidth 고정) */
  const scaleRef = useRef(1);
  /** 저장된 stroke 캐시 (진행 중인 획만 매 프레임 그리기) */
  const cacheRef = useRef<HTMLCanvasElement | null>(null);
  const cacheDirtyRef = useRef(true);

  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [ready, setReady] = useState(false);

  const boardWidth = fixed ? fixed.baseWidth * fixed.cols : undefined;
  const boardHeight = fixed ? fixed.baseHeight * fixed.rows : undefined;

  const invalidateCache = useCallback(() => {
    cacheDirtyRef.current = true;
  }, []);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { w, h, dpr } = sizeRef.current;
    if (w <= 0 || h <= 0) return;

    // 저장된 stroke는 오프스크린 캔버스에 캐시
    let cache = cacheRef.current;
    const cw = Math.max(1, Math.floor(w * dpr));
    const ch = Math.max(1, Math.floor(h * dpr));
    if (!cache) {
      cache = document.createElement("canvas");
      cacheRef.current = cache;
      cacheDirtyRef.current = true;
    }
    if (cache.width !== cw || cache.height !== ch) {
      cache.width = cw;
      cache.height = ch;
      cacheDirtyRef.current = true;
    }
    if (cacheDirtyRef.current) {
      const cctx = cache.getContext("2d");
      if (cctx) {
        cctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        cctx.clearRect(0, 0, w, h);
        for (const s of strokesRef.current) {
          const path = new Path2D(strokePath(s, scaleRef.current));
          cctx.fillStyle = s.color;
          cctx.fill(path);
        }
      }
      cacheDirtyRef.current = false;
    }

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(cache, 0, 0);
    ctx.restore();

    const live = drawingRef.current;
    if (live && live.length > 0) {
      const path = new Path2D(strokePath({ points: live, color, width }, scaleRef.current));
      ctx.fillStyle = color;
      ctx.fill(path);
    }
  }, [color, width]);

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const rect = container.getBoundingClientRect();
    const w = boardWidth ?? rect.width;
    const h = boardHeight ?? rect.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const prev = sizeRef.current;
    if (prev.w === w && prev.h === h && prev.dpr === dpr) {
      redraw();
      return;
    }
    // 그리는 도중에는 캔버스를 재설정하지 않음 (진행 중인 획 보호)
    if (drawingRef.current) return;
    sizeRef.current = { w, h, dpr };
    scaleRef.current = fixed ? fixed.baseWidth : w || 1;
    canvas.width = Math.max(1, Math.floor(w * dpr));
    canvas.height = Math.max(1, Math.floor(h * dpr));
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    invalidateCache();
    redraw();
  }, [redraw, boardWidth, boardHeight, fixed, invalidateCache]);



  // 현재 페이지의 stroke만 로드 (페이지 이동 시 언마운트되며 해제)
  useEffect(() => {
    let alive = true;
    strokesRef.current = [];
    redoRef.current = [];
    setReady(false);
    getPage(pageId)
      .then((page) => {
        if (!alive) return;
        strokesRef.current = page?.strokes ?? [];
        setReady(true);
        redraw();
      })
      .catch(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
      strokesRef.current = [];
      redoRef.current = [];
    };
  }, [pageId, redraw]);

  useEffect(() => {
    resize();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", resize);
      return () => window.removeEventListener("resize", resize);
    }
    const ro = new ResizeObserver(resize);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [resize, ready]);

  const flushAppend = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const pending = pendingRef.current;
      pendingRef.current = [];
      if (pending.length === 0) return;
      setStatus("saving");
      appendStrokes(pageId, pageType, pending)
        .then(() => setStatus("saved"))
        .catch(() => setStatus("idle"));
    }, 500);
  }, [pageId, pageType]);

  const flushReplace = useCallback(() => {
    setStatus("saving");
    replaceStrokes(pageId, pageType, strokesRef.current)
      .then(() => setStatus("saved"))
      .catch(() => setStatus("idle"));
  }, [pageId, pageType]);

  useEffect(() => {
    if (status !== "saved") return;
    const t = setTimeout(() => setStatus("idle"), 1500);
    return () => clearTimeout(t);
  }, [status]);

  const toPoint = (e: React.PointerEvent): StrokePoint => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const w = scaleRef.current || rect.width || 1;
    return {
      x: (e.clientX - rect.left) / w,
      y: (e.clientY - rect.top) / w,
      // 구형 WebView·손가락 터치 대비 fallback
      pressure: e.pressure && e.pressure > 0 ? e.pressure : 0.5,
    };
  };


  const eraseAt = (pt: StrokePoint) => {
    const threshold = 0.02;
    const before = strokesRef.current.length;
    strokesRef.current = strokesRef.current.filter(
      (s) =>
        !s.points.some(
          (p) => Math.abs(p.x - pt.x) < threshold && Math.abs(p.y - pt.y) < threshold,
        ),
    );
    if (strokesRef.current.length !== before) {
      redraw();
      flushReplace();
    }
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const pt = toPoint(e);
    if (tool === "eraser") {
      eraseAt(pt);
      return;
    }
    drawingRef.current = [pt];
    redraw();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.buttons === 0) return;
    const pt = toPoint(e);
    if (tool === "eraser") {
      eraseAt(pt);
      return;
    }
    if (!drawingRef.current) return;
    drawingRef.current.push(pt);
    redraw();
  };

  const onPointerUp = () => {
    const points = drawingRef.current;
    drawingRef.current = null;
    if (!points || points.length === 0) return;
    const stroke: Stroke = { points, color, width };
    strokesRef.current = [...strokesRef.current, stroke];
    redoRef.current = [];
    pendingRef.current.push(stroke);
    redraw();
    flushAppend();
  };

  const undo = () => {
    const last = strokesRef.current[strokesRef.current.length - 1];
    if (!last) return;
    strokesRef.current = strokesRef.current.slice(0, -1);
    redoRef.current = [...redoRef.current, last].slice(-MAX_HISTORY);
    pendingRef.current = [];
    redraw();
    flushReplace();
  };

  const redo = () => {
    const last = redoRef.current[redoRef.current.length - 1];
    if (!last) return;
    redoRef.current = redoRef.current.slice(0, -1);
    strokesRef.current = [...strokesRef.current, last];
    redraw();
    flushReplace();
  };

  const clearAll = () => {
    if (strokesRef.current.length === 0) return;
    strokesRef.current = [];
    redoRef.current = [];
    pendingRef.current = [];
    redraw();
    flushReplace();
  };

  if (overlay) {
    return (
      <div className="pointer-events-none absolute inset-0 z-20">
        <div className="pointer-events-auto sticky top-2 z-30 mx-auto w-fit max-w-full overflow-x-auto">
          <CanvasToolbar
            label={label}
            status={status}
            onUndo={undo}
            onRedo={redo}
            onClear={clearAll}
          />
        </div>
        <div ref={containerRef} className="absolute inset-0">
          <canvas
            ref={canvasRef}
            className="pointer-events-auto absolute inset-0 touch-none"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onPointerLeave={onPointerUp}
          />
        </div>
      </div>
    );
  }

  if (fixed) {
    const clampCols = (n: number) => Math.min(MAX_BOARD_UNITS, Math.max(1, n));
    const clampRows = (n: number) => Math.min(MAX_BOARD_UNITS, Math.max(1, n));
    return (
      <section className={cn("flex flex-col gap-2", className)}>
        <CanvasToolbar
          label={label}
          status={status}
          onUndo={undo}
          onRedo={redo}
          onClear={clearAll}
        />
        <div
          className="w-full overflow-auto overscroll-contain rounded-xl border border-border bg-card"
          style={{ maxHeight: "80vh" }}
        >
          <div
            ref={containerRef}
            className={cn("relative", grid && "bg-grid")}
            style={{ width: boardWidth, height: boardHeight }}
          >
            <canvas
              ref={canvasRef}
              className="absolute inset-0 touch-none"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onPointerLeave={onPointerUp}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <BoardButton
            icon={ChevronsDown}
            label="아래로 늘리기"
            disabled={fixed.rows >= MAX_BOARD_UNITS}
            onClick={() => fixed.onChange(fixed.cols, clampRows(fixed.rows + 1))}
          />
          <BoardButton
            icon={ChevronsUp}
            label="세로 줄이기"
            disabled={fixed.rows <= 1}
            onClick={() => fixed.onChange(fixed.cols, clampRows(fixed.rows - 1))}
          />
          <span className="mx-1 h-4 w-px bg-border" />
          <BoardButton
            icon={ChevronsRight}
            label="오른쪽으로 늘리기"
            disabled={fixed.cols >= MAX_BOARD_UNITS}
            onClick={() => fixed.onChange(clampCols(fixed.cols + 1), fixed.rows)}
          />
          <BoardButton
            icon={ChevronsLeft}
            label="가로 줄이기"
            disabled={fixed.cols <= 1}
            onClick={() => fixed.onChange(clampCols(fixed.cols - 1), fixed.rows)}
          />
          <span className="ml-auto">
            가로 {fixed.cols} × 세로 {fixed.rows}
          </span>
        </div>
      </section>
    );
  }

  return (
    <section className={cn("flex flex-col gap-2", className)}>
      <CanvasToolbar
        label={label}
        status={status}
        onUndo={undo}
        onRedo={redo}
        onClear={clearAll}
      />
      <div
        ref={containerRef}
        className={cn(
          "relative w-full flex-1 overflow-hidden rounded-xl border border-border bg-card",
          grid && "bg-grid",
        )}
        style={{ minHeight }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 touch-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onPointerLeave={onPointerUp}
        />
      </div>
    </section>
  );
}

function BoardButton({
  icon: Icon,
  label,
  disabled,
  onClick,
}: {
  icon: typeof ChevronsDown;
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center gap-1 rounded-xl border border-border bg-card px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-secondary",
        disabled && "opacity-40",
      )}
    >
      <Icon className="size-4" />
      {label}
    </button>
  );
}



function CanvasToolbar({
  label,
  status,
  onUndo,
  onRedo,
  onClear,
}: {
  label?: string | undefined;
  status: "idle" | "saving" | "saved";
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
}) {
  const { tool, setTool, color, setColor, width, setWidth } = usePen();

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-secondary/60 px-3 py-2">
      {label ? (
        <span className="mr-1 text-xs font-semibold tracking-wide text-muted-foreground">
          {label}
        </span>
      ) : null}
      <button
        type="button"
        aria-label="펜"
        aria-pressed={tool === "pen"}
        onClick={() => setTool("pen")}
        className={cn(
          "rounded-lg border border-transparent p-1.5 text-muted-foreground",
          tool === "pen" && "border-border bg-background text-primary",
        )}
      >
        <Pen className="size-4" />
      </button>
      <button
        type="button"
        aria-label="지우개"
        aria-pressed={tool === "eraser"}
        onClick={() => setTool("eraser")}
        className={cn(
          "rounded-lg border border-transparent p-1.5 text-muted-foreground",
          tool === "eraser" && "border-border bg-background text-primary",
        )}
      >
        <Eraser className="size-4" />
      </button>

      <span className="mx-1 h-5 w-px bg-border" />

      {PEN_COLORS.map((c) => (
        <button
          key={c.value}
          type="button"
          aria-label={`${c.name} 펜`}
          aria-pressed={color === c.value}
          onClick={() => {
            setColor(c.value);
            setTool("pen");
          }}
          className={cn(
            "size-6 rounded-full border-2",
            color === c.value ? "border-primary" : "border-transparent",
          )}
          style={{ backgroundColor: c.value }}
        />
      ))}

      <span className="mx-1 h-5 w-px bg-border" />

      {PEN_WIDTHS.map((w) => (
        <button
          key={w}
          type="button"
          aria-label={`굵기 ${w}`}
          aria-pressed={width === w}
          onClick={() => setWidth(w)}
          className={cn(
            "flex size-6 items-center justify-center rounded-lg border",
            width === w ? "border-primary bg-background" : "border-transparent",
          )}
        >
          <span
            className="block rounded-full bg-foreground"
            style={{ width: w + 1, height: w + 1 }}
          />
        </button>
      ))}

      <span className="mx-1 h-5 w-px bg-border" />

      <button type="button" aria-label="실행 취소" onClick={onUndo} className="p-1.5">
        <Undo2 className="size-4" />
      </button>
      <button type="button" aria-label="다시 실행" onClick={onRedo} className="p-1.5">
        <Redo2 className="size-4" />
      </button>
      <button
        type="button"
        aria-label="전체 지우기"
        onClick={onClear}
        className="p-1.5 text-destructive"
      >
        <RotateCcw className="size-4" />
      </button>

      <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
        {status === "saving" ? (
          <>
            <Loader2 className="size-3 animate-spin" /> 저장 중
          </>
        ) : status === "saved" ? (
          <>
            <Check className="size-3 text-primary" /> 저장됨
          </>
        ) : null}
      </span>
    </div>
  );
}
