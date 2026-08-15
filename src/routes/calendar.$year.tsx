import { createFileRoute } from "@tanstack/react-router";

import { MiniCalendar } from "@/components/MiniCalendar";
import { PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/calendar/$year")({
  head: () => ({
    meta: [
      { title: "연간 달력 — LH 업무수첩" },
      { name: "description", content: "선택한 연도의 1~12월 달력에서 원하는 날짜로 이동합니다." },
      { property: "og:title", content: "연간 달력 — LH 업무수첩" },
      { property: "og:description", content: "12개월 달력으로 일간·월간 플랜에 바로 접근." },
    ],
  }),
  component: CalendarPage,
});

function CalendarPage() {
  const { year } = Route.useParams();
  const y = Number(year);
  return (
    <PageShell title={`${y}년 연간 달력`} subtitle="날짜를 누르면 일간 플랜으로 이동합니다" wide>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 12 }, (_, i) => (
          <MiniCalendar key={i} year={y} month={i + 1} />
        ))}
      </div>
    </PageShell>
  );
}
