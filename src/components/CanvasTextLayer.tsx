import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";
import { TEXT_SIZES, type TextSize } from "@/lib/pen-context";

const ALLOWED = new Set(["SPAN", "DIV", "BR", "B", "I", "U", "P", "FONT"]);

export function textSizePx(size: TextSize): number {
  return TEXT_SIZES.find((s) => s.key === size)?.px ?? 18;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** 구 형식(텍스트 상자 JSON 배열)을 HTML로 1회 변환 */
export function normalizeCanvasText(raw: string | undefined): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  if (!trimmed.startsWith("[")) return raw;
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (!Array.isArray(parsed)) return "";
    return parsed
      .filter((b): b is { text?: string; color?: string; size?: TextSize } => !!b && typeof b === "object")
      .map((b) => {
        const text = escapeHtml(String(b.text ?? "")).replace(/\n/g, "<br>");
        if (!text) return "";
        const px = textSizePx((b.size as TextSize) ?? "md");
        const color = b.color ?? "inherit";
        return `<div><span style="color:${color};font-size:${px}px">${text}</span></div>`;
      })
      .filter(Boolean)
      .join("");
  } catch {
    return "";
  }
}

/** 허용 태그만 남기고 script/style/속성 대부분 제거 */
export function sanitizeCanvasHtml(html: string): string {
  if (typeof document === "undefined") return html;
  const root = document.createElement("div");
  root.innerHTML = html;
  const walk = (node: Element) => {
    for (const child of [...node.children]) {
      if (!ALLOWED.has(child.tagName)) {
        const text = document.createTextNode(child.textContent ?? "");
        child.replaceWith(text);
        continue;
      }
      for (const attr of [...child.attributes]) {
        const keep =
          attr.name === "style" ||
          (child.tagName === "FONT" && (attr.name === "color" || attr.name === "size"));
        if (!keep) child.removeAttribute(attr.name);
      }
      walk(child);
      // 서식 대기용 zero-width space만 남은 빈 span 제거
      if (child.tagName === "SPAN" && /^\u200B*$/.test(child.textContent ?? "")) {
        child.remove();
      }
    }
  };
  walk(root);
  return root.innerHTML.replace(/\u200B/g, "");
}

interface Props {
  /** 저장된 HTML */
  value: string;
  onChange: (html: string) => void;
  active: boolean;
  /** 보드 전체 크기 */
  width?: number | undefined;
  height?: number | undefined;
  /** 기본 글자 크기 */
  baseSize: number;
  editorRef?: React.RefObject<HTMLDivElement | null>;
}

export function CanvasTextLayer({
  value,
  onChange,
  active,
  width,
  height,
  baseSize,
  editorRef,
}: Props) {
  const innerRef = useRef<HTMLDivElement | null>(null);
  const ref = editorRef ?? innerRef;
  const lastHtml = useRef<string>("");

  // 외부 값이 바뀔 때만 DOM 동기화 (입력 중 커서 유지)
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (value === lastHtml.current) return;
    lastHtml.current = value;
    el.innerHTML = value;
  }, [value, ref]);

  return (
    <div
      ref={ref}
      role="textbox"
      aria-label="텍스트 입력"
      aria-multiline="true"
      contentEditable={active}
      suppressContentEditableWarning
      onInput={(e) => {
        const html = sanitizeCanvasHtml((e.currentTarget as HTMLDivElement).innerHTML);
        lastHtml.current = html;
        onChange(html);
      }}
      className={cn(
        "canvas-text absolute inset-0 z-10 whitespace-pre-wrap break-words p-2 leading-snug outline-none",
        active ? "pointer-events-auto" : "pointer-events-none",
      )}

      style={{ width, height, fontSize: baseSize, caretColor: "currentColor" }}
    />
  );
}
