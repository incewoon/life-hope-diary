import { createFileRoute, Link } from "@tanstack/react-router";
import { addDays, format, subDays } from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { DaySchedule } from "@/components/DaySchedule";
import { HandwritingCanvas } from "@/components/HandwritingCanvas";
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

function DailyPage() {
  const { year, month, day } = Route.useParams();
  const y = Number(year);
  const m = Number(month);
  const d = Number(day);
  const id = dailyId(y, m, d);
  const { fields, setField, status } = usePageText(id, "daily");

  const current = new Date(y, m - 1, d);
  const prev = subDays(current, 1);
  const next = addDays(current, 1);

  return (
    <PageShell
      title={`${y}년 ${m}월 ${d}일`}
      subtitle={status === "saving" ? "저장 중…" : status === "saved" ? "저장됨" : "일간 플랜"}
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
      <HandwritingCanvas pageId={id} pageType="daily" grid minHeight={560} label="자유 필기" />

    </PageShell>
  );
}
