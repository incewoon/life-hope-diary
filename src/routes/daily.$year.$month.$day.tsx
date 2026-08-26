import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { addDays, format, subDays } from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { DaySchedule } from "@/components/DaySchedule";
import { HandwritingCanvas, type BoardBg } from "@/components/HandwritingCanvas";
import { PageShell } from "@/components/PageShell";
import { usePageText } from "@/lib/use-page-text";
import { dailyId } from "@/lib/year";

export const Route = createFileRoute("/daily/$year/$month/$day")({
  head: () => ({
    meta: [
      { title: "일간 플랜 — LH 업무수첩" },
      { name: "description", content: "하루의 핵심 업무와 메모를 필기로 기록하는 일간 플랜." },
      { property: "og:title", content: "일간 플랜 — LH 업무수첩" },
      { property: "og:description", content: "오늘의 우선순위와 메모를 한 화면에서 관리하세요." },
    ],
  }),
  component: DailyPage,
});

function dayParams(date: Date) {
  return {
    year: String(date.getFullYear()),
    month: String(date.getMonth() + 1).padStart(2, "0"),
    day: String(date.getDate()).padStart(2, "0"),
  };
}

function parsePair(raw: string | undefined, fallback: [number, number]): [number, number] {
  const [a, b] = (raw ?? "").split(",").map(Number);
  if (!Number.isFinite(a) || !Number.isFinite(b) || (a as number) <= 0 || (b as number) <= 0) {
    return fallback;
  }
  return [a as number, b as number];
}

/** 가로모드 기준 필기판 기본 크기 (화면을 한 번만 읽어 산출) */
function computeBase(): [number, number] {
  if (typeof window === "undefined") return [960, 560];
  const long = Math.max(window.innerWidth, window.innerHeight);
  const short = Math.min(window.innerWidth, window.innerHeight);
  const w = Math.max(640, Math.round(long - 80 - 48));
  const h = Math.max(320, Math.round(short - 260));
  return [w, h];
}

function DailyPage() {
  const { year, month, day } = Route.useParams();
  const y = Number(year);
  const m = Number(month);
  const d = Number(day);
  const id = dailyId(y, m, d);
  const { fields, setField, status, loaded } = usePageText(id, "daily");

  const current = new Date(y, m - 1, d);
  const prev = subDays(current, 1);
  const next = addDays(current, 1);

  const [fallbackBase, setFallbackBase] = useState<[number, number]>([960, 560]);
  useEffect(() => setFallbackBase(computeBase()), []);

  const [baseWidth, baseHeight] = parsePair(fields["canvasBase"], fallbackBase);
  const [cols, rows] = parsePair(fields["canvasGrid"], [1, 1]);

  // 최초 1회 기준 크기 저장
  useEffect(() => {
    if (!loaded) return;
    if (fields["canvasBase"]) return;
    const [w, h] = computeBase();
    setField("canvasBase", `${w},${h}`);
  }, [loaded, fields, setField]);


  const zoom = Number(fields["canvasZoom"]) || 1;

  return (
    <PageShell
      title="일간 플랜"
      subtitle={status === "saving" ? "저장 중…" : status === "saved" ? "저장됨" : undefined}
      wide
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <Link
          to="/daily/$year/$month/$day"
          params={dayParams(prev)}
          className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground"
        >
          <ChevronLeft className="size-4" />
          {format(prev, "M월 d일 (E)", { locale: ko })}
        </Link>
        <p className="text-center text-xl font-bold tracking-tight text-foreground">
          {format(current, "yyyy년 M월 d일 (E)", { locale: ko })}
        </p>
        <Link
          to="/daily/$year/$month/$day"
          params={dayParams(next)}
          className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground"
        >
          {format(next, "M월 d일 (E)", { locale: ko })}
          <ChevronRight className="size-4" />
        </Link>
      </div>

      <DaySchedule
        baseDate={current}
        value={fields["schedule"]}
        onChange={(v) => setField("schedule", v)}
      />
      <HandwritingCanvas
        pageId={id}
        pageType="daily"
        background={(fields["canvasBg"] as BoardBg | undefined) ?? "none"}
        onBackgroundChange={(bg) => setField("canvasBg", bg)}

        textsValue={fields["canvasTexts"]}
        onTextsChange={(json) => setField("canvasTexts", json)}
        zoom={zoom}
        onZoomChange={(z) => setField("canvasZoom", String(z))}
        fixed={{
          baseWidth,
          baseHeight,
          cols,
          rows,
          onChange: (c, r) => setField("canvasGrid", `${c},${r}`),
        }}
      />


    </PageShell>
  );
}
