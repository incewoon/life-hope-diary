import { createFileRoute } from "@tanstack/react-router";

import { HandwritingCanvas } from "@/components/HandwritingCanvas";
import { MiniCalendar } from "@/components/MiniCalendar";
import { PageShell } from "@/components/PageShell";
import { monthlyId } from "@/lib/year";

export const Route = createFileRoute("/monthly/$year/$month")({
  head: () => ({
    meta: [
      { title: "월간 플랜 — LH 업무수첩" },
      { name: "description", content: "월별 일정과 목표를 손글씨로 기록하는 월간 플랜." },
      { property: "og:title", content: "월간 플랜 — LH 업무수첩" },
      { property: "og:description", content: "달력과 함께 월간 계획을 필기로 남기세요." },
    ],
  }),
  component: MonthlyPage,
});

function MonthlyPage() {
  const { year, month } = Route.useParams();
  const y = Number(year);
  const m = Number(month);
  const id = monthlyId(y, m);

  return (
    <PageShell title={`${y}년 ${m}월 플랜`} subtitle="달력 옆 여백에 이달의 목표를 적어보세요" wide>
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <MiniCalendar year={y} month={m} />
        <HandwritingCanvas pageId={id} pageType="monthly" grid minHeight={520} label="월간 메모" />
      </div>
    </PageShell>
  );
}
