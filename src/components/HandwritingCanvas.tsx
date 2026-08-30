import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  ChevronsRight,
  Type,
  Grid2x2,
  ChevronDown,
  Highlighter,
  Minus,
  Plus,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  HIGHLIGHTER_COLOR,
  HIGHLIGHTER_WIDTH,
  PEN_COLORS,
  PEN_WIDTHS,
  TEXT_SIZES,
  usePen,
} from "@/lib/pen-context";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  CanvasTextLayer,
  normalizeCanvasText,
  textSizePx,
} from "@/components/CanvasTextLayer";
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
  /** 0 이하이면 아직 고정되지 않음 → 스크롤 영역 크기에 반응형으로 맞춤 */
  baseWidth: number;
  baseHeight: number;
  cols: number;
  rows: number;
  onChange: (cols: number, rows: number) => void;
  /** 첫 필기/텍스트가 저장될 때 현재 측정 크기를 고정 */
  onFixBase?: ((w: number, h: number) => void) | undefined;
}

export const MAX_BOARD_UNITS = 5;

export type BoardBg = "none" | "grid" | "dot" | "line";

export const BOARD_BGS: { key: BoardBg; label: string }[] = [
  { key: "none", label: "없음" },
  { key: "grid", label: "격자" },
  { key: "dot", label: "도트" },
  { key: "line", label: "가로줄" },
];

function bgClass(bg: BoardBg): string | undefined {
  if (bg === "grid") return "bg-grid";
  if (bg === "dot") return "bg-dot";
  if (bg === "line") return "bg-line";
  return undefined;
}

/** 확대 배율에 맞춰 배경 무늬 크기를 함께 조정 (디자인 토큰 색상 유지) */
function bgStyle(bg: BoardBg, zoom: number): React.CSSProperties | undefined {
  const border = "var(--color-border)";
  if (bg === "grid") {
    const s = 28 * zoom;
    return {
      backgroundImage: `linear-gradient(to right, ${border} 1px, transparent 1px), linear-gradient(to bottom, ${border} 1px, transparent 1px)`,
      backgroundSize: `${s}px ${s}px`,
    };
  }
  if (bg === "dot") {
    const s = 24 * zoom;
    return {
      backgroundImage: `radial-gradient(${border} ${1.5 * zoom}px, transparent ${1.5 * zoom}px)`,
      backgroundSize: `${s}px ${s}px`,
    };
  }
  if (bg === "line") {
    const s = 32 * zoom;
    return {
      backgroundImage: `linear-gradient(to bottom, ${border} 1px, transparent 1px)`,
      backgroundSize: `100% ${s}px`,
    };
  }
  return undefined;
}

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
  /** 배경 선택 (fixed 모드) */
  background?: BoardBg | undefined;
  onBackgroundChange?: ((bg: BoardBg) => void) | undefined;
  /** 텍스트 상자 JSON (fixed 모드) */
  textsValue?: string | undefined;
  onTextsChange?: ((json: string) => void) | undefined;
  /** 화면 배율 (fixed 모드) */
  zoom?: number | undefined;
  onZoomChange?: ((zoom: number) => void) | undefined;
}

export const ZOOM_MIN = 0.5;
export const ZOOM_MAX = 2;
export const ZOOM_STEP = 0.1;

function clampZoom(z: number): number {
  return Math.round(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z)) * 10) / 10;
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
  background = "none",
  onBackgroundChange,
  textsValue,
  onTextsChange,
  zoom = 1,
  onZoomChange,
}: Props) {
  const { tool, color: penColor, width: penWidth } = usePen();
  const isHighlighter = tool === "highlighter";
  const color = isHighlighter ? HIGHLIGHTER_COLOR : penColor;
  const width = isHighlighter ? HIGHLIGHTER_WIDTH : penWidth;

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
  /** 스크롤 컨테이너 (고정 모드) */
  const scrollRef = useRef<HTMLDivElement | null>(null);
  /** 화면상의 활성 포인터들 (두 손가락 이동 판정용) */
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const panRef = useRef<{ x: number; y: number; left: number; top: number } | null>(null);


  /** 스크롤 영역이 화면 하단까지 꽉 차도록 계산된 높이 */
  const [viewportHeight, setViewportHeight] = useState<number | undefined>(undefined);
  /** 스크롤 영역의 실제 내부 크기 (기준 크기가 아직 고정되지 않았을 때 사용) */
  const [measured, setMeasured] = useState<{ w: number; h: number } | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [ready, setReady] = useState(false);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const savedRangeRef = useRef<Range | null>(null);

  const baseFixed = !!fixed && fixed.baseWidth > 0 && fixed.baseHeight > 0;
  const effBaseWidth = fixed ? (baseFixed ? fixed.baseWidth : (measured?.w ?? 0)) : 0;
  const effBaseHeight = fixed ? (baseFixed ? fixed.baseHeight : (measured?.h ?? 0)) : 0;

  const baseBoardWidth = fixed ? effBaseWidth * fixed.cols : undefined;
  const baseBoardHeight = fixed ? effBaseHeight * fixed.rows : undefined;
  const boardWidth = baseBoardWidth ? baseBoardWidth * zoom : undefined;

  // 고정 보드: 스크롤 영역 상단 위치를 재어 화면 하단까지 채우는 높이 계산
  useEffect(() => {
    if (!fixed) return;
    const measure = () => {
      const el = scrollRef.current;
      if (!el) return;
      // 페이지를 아래로 스크롤했을 때 도구영역 + 필기영역이 화면을 꽉 채우도록,
      // 화면 높이에서 도구영역 높이(섹션 상단 ~ 스크롤 영역 상단)와 여백만 뺀다.
      const section = el.closest("section");
      const toolbar = section ? el.getBoundingClientRect().top - section.getBoundingClientRect().top : 0;
      // 세로 모드에서는 하단 고정 메뉴바(h-14 = 56px)가 화면 아래를 가리므로
      // 그만큼을 추가로 빼서 최하단 스크롤 시 도구영역까지 보이게 한다.
      const portrait = window.matchMedia?.("(orientation: portrait)").matches ?? false;
      const bottomReserve = portrait ? 56 + 12 : 12;
      const h = Math.max(320, Math.round(window.innerHeight - toolbar - bottomReserve));
      setViewportHeight(h);
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
    };
  }, [fixed]);

  // 스크롤 영역 내부(스크롤바 제외) 크기 측정 → 기준 크기 미고정 시 반응형 기본값
  useEffect(() => {
    if (!fixed) return;
    const el = scrollRef.current;
    if (!el) return;
    const read = () => {
      const w = Math.max(1, el.clientWidth);
      const h = Math.max(1, el.clientHeight);
      setMeasured((prev) => (prev && prev.w === w && prev.h === h ? prev : { w, h }));
    };
    read();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", read);
      return () => window.removeEventListener("resize", read);
    }
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fixed, viewportHeight]);

  /** 첫 콘텐츠 저장 시 현재 측정 크기를 기준 크기로 고정 */
  const fixBaseIfNeeded = useCallback(() => {
    if (!fixed || baseFixed || !measured) return;
    fixed.onFixBase?.(Math.round(measured.w), Math.round(measured.h));
  }, [fixed, baseFixed, measured]);

  // 보드 크기는 확장 버튼(배수)과 배율로만 결정 — 축소해도 자동으로 늘어나지 않음
  const boardHeight = baseBoardHeight ? baseBoardHeight * zoom : undefined;


  const textHtml = useMemo(() => normalizeCanvasText(textsValue), [textsValue]);
  const textMode = tool === "text";

  // 팝오버 클릭으로 포커스를 잃어도 직전 커서/선택을 복원할 수 있게 기억
  useEffect(() => {
    if (!textMode) return;
    const onSelChange = () => {
      const sel = window.getSelection();
      const el = editorRef.current;
      if (!sel || sel.rangeCount === 0 || !el) return;
      if (!el.contains(sel.anchorNode)) return;
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    };
    document.addEventListener("selectionchange", onSelChange);
    return () => document.removeEventListener("selectionchange", onSelChange);
  }, [textMode]);

  /** 선택 영역이 있으면 그 구간에, 없으면 커서 이후 입력부터 서식 적용 */
  const applyTextFormat = useCallback((cmd: "foreColor" | "fontSize", value: string) => {
    const el = editorRef.current;
    if (!el) return;
    const prop = cmd === "foreColor" ? "color" : "font-size";

    const sel = window.getSelection();
    let range: Range | null = null;
    if (sel && sel.rangeCount > 0 && el.contains(sel.anchorNode)) {
      range = sel.getRangeAt(0).cloneRange();
    } else if (
      savedRangeRef.current &&
      el.contains(savedRangeRef.current.commonAncestorContainer)
    ) {
      range = savedRangeRef.current.cloneRange();
    }
    if (!range) {
      range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
    }

    el.focus({ preventScroll: true });

    const span = document.createElement("span");
    span.style.setProperty(prop, value);

    if (range.collapsed) {
      // 커서 위치에 빈 서식 구간을 만들고 그 안으로 커서 이동 → 이후 입력분만 적용
      span.textContent = "\u200B";
      range.insertNode(span);
      const r = document.createRange();
      r.setStart(span.firstChild as Text, 1);
      r.collapse(true);
      sel?.removeAllRanges();
      sel?.addRange(r);
      savedRangeRef.current = r.cloneRange();
      return;
    }

    const frag = range.extractContents();
    // 선택 구간 내부의 같은 속성 서식은 제거해 새 값이 우선되게
    const strip = (node: ParentNode) => {
      node.querySelectorAll("*").forEach((child) => {
        if (child instanceof HTMLElement) child.style.removeProperty(prop);
        if (child.tagName === "FONT") {
          child.removeAttribute(cmd === "foreColor" ? "color" : "size");
        }
      });
    };
    strip(frag);
    span.appendChild(frag);
    range.insertNode(span);

    const r = document.createRange();
    r.selectNodeContents(span);
    sel?.removeAllRanges();
    sel?.addRange(r);
    savedRangeRef.current = r.cloneRange();

    el.dispatchEvent(new Event("input", { bubbles: true }));
  }, []);





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
    scaleRef.current = fixed ? effBaseWidth * zoom : w || 1;
    canvas.width = Math.max(1, Math.floor(w * dpr));
    canvas.height = Math.max(1, Math.floor(h * dpr));
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    invalidateCache();
    redraw();
  }, [redraw, boardWidth, boardHeight, fixed, effBaseWidth, zoom, invalidateCache]);



  // 현재 페이지의 stroke만 로드 (페이지 이동 시 언마운트되며 해제)
  useEffect(() => {
    let alive = true;
    strokesRef.current = [];
    redoRef.current = [];
    drawingRef.current = null;
    activePointerRef.current = null;
    invalidateCache();
    setReady(false);
    getPage(pageId)
      .then((page) => {
        if (!alive) return;
        strokesRef.current = page?.strokes ?? [];
        invalidateCache();
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
  }, [pageId, redraw, invalidateCache]);


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
      invalidateCache();
      redraw();
      flushReplace();
    }
  };

  /** 두 손가락 이동 시작 (진행 중인 필기는 취소) */
  const startPan = () => {
    const pts = [...pointersRef.current.values()];
    const a = pts[0];
    const b = pts[1];
    const el = scrollRef.current;
    if (!a || !b || !el) return;
    drawingRef.current = null;
    activePointerRef.current = null;
    panRef.current = {
      x: (a.x + b.x) / 2,
      y: (a.y + b.y) / 2,
      left: el.scrollLeft,
      top: el.scrollTop,
    };
    redraw();
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size >= 2) {
      startPan();
      return;
    }
    if (activePointerRef.current !== null) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* 캡처 실패해도 그리기는 계속 */
    }
    activePointerRef.current = e.pointerId;
    const pt = toPoint(e);
    if (tool === "eraser") {
      eraseAt(pt);
      return;
    }
    drawingRef.current = [pt];
    redraw();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (pointersRef.current.has(e.pointerId)) {
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }
    const pan = panRef.current;
    if (pan && pointersRef.current.size >= 2) {
      const pts = [...pointersRef.current.values()];
      const a = pts[0];
      const b = pts[1];
      const el = scrollRef.current;
      if (!a || !b || !el) return;
      const cx = (a.x + b.x) / 2;
      const cy = (a.y + b.y) / 2;
      el.scrollLeft = pan.left - (cx - pan.x);
      el.scrollTop = pan.top - (cy - pan.y);
      return;
    }
    if (activePointerRef.current !== e.pointerId) return;
    const pt = toPoint(e);
    if (tool === "eraser") {
      eraseAt(pt);
      return;
    }
    if (!drawingRef.current) return;
    drawingRef.current.push(pt);
    redraw();
  };


  const endPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) panRef.current = null;
    if (activePointerRef.current !== e.pointerId) return;
    activePointerRef.current = null;

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      /* noop */
    }
    const points = drawingRef.current;
    drawingRef.current = null;
    if (!points || points.length === 0) {
      redraw();
      return;
    }
    const stroke: Stroke = { points, color, width };
    strokesRef.current = [...strokesRef.current, stroke];
    redoRef.current = [];
    pendingRef.current.push(stroke);
    invalidateCache();
    redraw();
    flushAppend();
    fixBaseIfNeeded();
    resize();
  };

  const undo = () => {
    const last = strokesRef.current[strokesRef.current.length - 1];
    if (!last) return;
    strokesRef.current = strokesRef.current.slice(0, -1);
    redoRef.current = [...redoRef.current, last].slice(-MAX_HISTORY);
    pendingRef.current = [];
    invalidateCache();
    redraw();
    flushReplace();
  };

  const redo = () => {
    const last = redoRef.current[redoRef.current.length - 1];
    if (!last) return;
    redoRef.current = redoRef.current.slice(0, -1);
    strokesRef.current = [...strokesRef.current, last];
    invalidateCache();
    redraw();
    flushReplace();
  };

  const clearAll = () => {
    if (strokesRef.current.length === 0) return;
    strokesRef.current = [];
    redoRef.current = [];
    pendingRef.current = [];
    invalidateCache();
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
            onPointerUp={endPointer}
            onPointerCancel={endPointer}
          />
        </div>
      </div>
    );
  }

  if (fixed) {
    const clamp = (n: number) => Math.min(MAX_BOARD_UNITS, Math.max(1, n));
    return (
      <section className={cn("flex flex-col gap-2", className)}>
        <CanvasToolbar
          label={label}
          status={status}
          onUndo={undo}
          onRedo={redo}
          onClear={clearAll}
          background={background}
          {...(onBackgroundChange ? { onBackgroundChange } : {})}
          {...(onTextsChange ? { onTextFormat: applyTextFormat } : {})}
          zoom={zoom}
          {...(onZoomChange ? { onZoomChange } : {})}
        />
        <div className="relative">
          <div
            ref={scrollRef}
            className="scroll-thick w-full overflow-scroll overscroll-contain rounded-xl border border-border bg-muted"
            style={{ height: viewportHeight ?? "80vh" }}
          >

            <div
              ref={containerRef}
              className="relative bg-card shadow-[0_0_0_1px_var(--color-border)]"
              style={{ width: boardWidth, height: boardHeight, ...bgStyle(background, zoom) }}
            >
              <canvas
                ref={canvasRef}
                className={cn("absolute inset-0 touch-none", textMode && "pointer-events-none")}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={endPointer}
                onPointerCancel={endPointer}
              />
              {onTextsChange ? (
                <div
                  className="absolute left-0 top-0 origin-top-left"
                  style={{ transform: `scale(${zoom})` }}
                >
                  <CanvasTextLayer
                    editorRef={editorRef}
                    value={textHtml}
                    onChange={(json) => {
                      onTextsChange(json);
                      if (json.replace(/<[^>]*>/g, "").trim().length > 0) fixBaseIfNeeded();
                    }}
                    active={textMode}
                    width={baseBoardWidth}
                    height={baseBoardHeight}
                    baseSize={textSizePx("md")}
                  />
                </div>
              ) : null}
            </div>
          </div>


          {fixed.rows < MAX_BOARD_UNITS ? (
            <EdgeButton
              icon={ChevronsDown}
              label="아래로 늘리기"
              className="bottom-2 left-1/2 -translate-x-1/2"
              onClick={() => fixed.onChange(fixed.cols, clamp(fixed.rows + 1))}
            />
          ) : null}
          {fixed.cols < MAX_BOARD_UNITS ? (
            <EdgeButton
              icon={ChevronsRight}
              label="오른쪽으로 늘리기"
              className="right-2 top-1/2 -translate-y-1/2"
              onClick={() => fixed.onChange(clamp(fixed.cols + 1), fixed.rows)}
            />
          ) : null}
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
          onPointerUp={endPointer}
          onPointerCancel={endPointer}
        />
      </div>
    </section>
  );
}

function EdgeButton({
  icon: Icon,
  label,
  className,
  onClick,
}: {
  icon: typeof ChevronsDown;
  label: string;
  className: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "absolute z-10 flex size-9 items-center justify-center rounded-full border border-border bg-card/90 text-muted-foreground shadow-sm backdrop-blur transition-colors hover:bg-secondary hover:text-foreground",
        className,
      )}
    >
      <Icon className="size-5" />
    </button>
  );
}





function ToolButton({
  active,
  label,
  icon: Icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: typeof Pen;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition-colors",
        active && "bg-background text-primary shadow-sm",
      )}
    >
      <Icon className="size-4" />
    </button>
  );
}


function CanvasToolbar({
  label,
  status,
  onUndo,
  onRedo,
  onClear,
  background,
  onBackgroundChange,
  onTextFormat,
  zoom,
  onZoomChange,
}: {
  label?: string | undefined;
  status: "idle" | "saving" | "saved";
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  background?: BoardBg | undefined;
  onBackgroundChange?: ((bg: BoardBg) => void) | undefined;
  onTextFormat?: ((cmd: "foreColor" | "fontSize", value: string) => void) | undefined;
  zoom?: number | undefined;
  onZoomChange?: ((zoom: number) => void) | undefined;
}) {
  const { tool, setTool, color, setColor, width, setWidth, textSize, setTextSize } = usePen();
  const textMode = tool === "text";
  const penMode = !textMode;
  const currentSizeLabel = TEXT_SIZES.find((s) => s.key === textSize)?.label ?? "보통";

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-secondary/60 px-3 py-2">
      {label ? (
        <span className="mr-1 text-xs font-semibold tracking-wide text-muted-foreground">
          {label}
        </span>
      ) : null}

      {/* 1) 배경 */}
      {onBackgroundChange ? (
        <Popover>
          <PopoverTrigger className="flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground">
            <Grid2x2 className="size-3.5" />
            배경
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </PopoverTrigger>
          <PopoverContent align="start" className="w-40 p-2">
            <div className="flex flex-col gap-1">
              {BOARD_BGS.map((b) => (
                <button
                  key={b.key}
                  type="button"
                  onClick={() => onBackgroundChange(b.key)}
                  className={cn(
                    "flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-secondary",
                    background === b.key && "text-primary",
                  )}
                >
                  {b.label}
                  {background === b.key ? <Check className="size-3.5" /> : null}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      ) : null}

      {/* 2) 필기 / 타이핑 모드 */}
      <div className="flex items-center gap-0.5 rounded-lg border border-border bg-secondary p-0.5">
        <ModeButton
          active={penMode}
          label="필기"
          icon={Pen}
          onClick={() => setTool("pen")}
        />
        {onTextFormat ? (
          <ModeButton
            active={textMode}
            label="타이핑"
            icon={Type}
            onClick={() => setTool("text")}
          />
        ) : null}
      </div>

      {penMode ? (
        <>
          {/* 지우개·형광펜은 필기 모드에서만 */}
          <div className="flex items-center gap-0.5 rounded-lg border border-border bg-secondary p-0.5">
            <ToolButton
              active={tool === "pen"}
              label="펜"
              icon={Pen}
              onClick={() => setTool("pen")}
            />
            <ToolButton
              active={tool === "highlighter"}
              label="형광펜"
              icon={Highlighter}
              onClick={() => setTool("highlighter")}
            />
            <ToolButton
              active={tool === "eraser"}
              label="지우개"
              icon={Eraser}
              onClick={() => setTool("eraser")}
            />
          </div>

          <Popover>
            <PopoverTrigger className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground">
              <span
                className="block rounded-full"
                style={{ backgroundColor: color, width: width + 4, height: width + 4 }}
              />
              펜 설정
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </PopoverTrigger>
            <PopoverContent align="start" className="w-52 p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">색상</p>
              <div className="mb-3 flex items-center gap-2">
                {PEN_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    aria-label={`${c.name} 펜`}
                    onClick={() => {
                      setColor(c.value);
                      setTool("pen");
                    }}
                    className={cn(
                      "size-7 rounded-full border-2",
                      color === c.value ? "border-primary" : "border-transparent",
                    )}
                    style={{ backgroundColor: c.value }}
                  />
                ))}
              </div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">굵기</p>
              <div className="flex items-center gap-2">
                {PEN_WIDTHS.map((w) => (
                  <button
                    key={w}
                    type="button"
                    aria-label={`굵기 ${w}`}
                    onClick={() => setWidth(w)}
                    className={cn(
                      "flex size-8 items-center justify-center rounded-lg border",
                      width === w ? "border-primary bg-secondary" : "border-border",
                    )}
                  >
                    <span
                      className="block rounded-full bg-foreground"
                      style={{ width: w + 1, height: w + 1 }}
                    />
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </>
      ) : onTextFormat ? (
        <>
          <Popover>
            <PopoverTrigger className="flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground">
              {`글자 크기(${currentSizeLabel})`}
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </PopoverTrigger>
            <PopoverContent align="start" className="w-40 p-2">
              <div className="flex flex-col gap-1">
                {TEXT_SIZES.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onPointerDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setTextSize(s.key);
                      onTextFormat("fontSize", `${s.px}px`);
                    }}
                    className={cn(
                      "flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-secondary",
                      textSize === s.key && "text-primary",
                    )}
                  >
                    <span style={{ fontSize: s.px * 0.7 }}>{s.label}</span>
                    {textSize === s.key ? <Check className="size-3.5" /> : null}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground">
              <span className="block size-3.5 rounded-full" style={{ backgroundColor: color }} />
              글자 색상
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </PopoverTrigger>
            <PopoverContent align="start" className="w-40 p-3">
              <div className="flex items-center gap-2">
                {PEN_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    aria-label={`${c.name} 글자색`}
                    onPointerDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setColor(c.value);
                      onTextFormat("foreColor", c.value);
                    }}
                    className={cn(
                      "size-7 rounded-full border-2",
                      color === c.value ? "border-primary" : "border-transparent",
                    )}
                    style={{ backgroundColor: c.value }}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </>
      ) : null}

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

      {/* 최우측: 확대 / 축소 */}
      {onZoomChange ? (
        <div className="flex items-center gap-0.5 rounded-lg border border-border bg-background px-1 py-0.5">
          <button
            type="button"
            aria-label="축소"
            onClick={() => onZoomChange(clampZoom((zoom ?? 1) - ZOOM_STEP))}
            disabled={(zoom ?? 1) <= ZOOM_MIN}
            className="rounded-md p-1.5 text-foreground disabled:opacity-40"
          >
            <Minus className="size-4" />
          </button>
          <span className="w-10 text-center text-xs tabular-nums text-muted-foreground">
            {Math.round((zoom ?? 1) * 100)}%
          </span>
          <button
            type="button"
            aria-label="확대"
            onClick={() => onZoomChange(clampZoom((zoom ?? 1) + ZOOM_STEP))}
            disabled={(zoom ?? 1) >= ZOOM_MAX}
            className="rounded-md p-1.5 text-foreground disabled:opacity-40"
          >
            <Plus className="size-4" />
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ModeButton({
  active,
  label,
  icon: Icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: typeof Pen;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground transition-colors",
        active && "bg-background text-primary shadow-sm",
      )}
    >
      <Icon className="size-4" />
      {label}
    </button>
  );
}
