import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef } from "react";

import { HandwritingCanvas } from "@/components/HandwritingCanvas";
import { MiniCalendar } from "@/components/MiniCalendar";
import { MonthlyChecklist } from "@/components/MonthlyChecklist";
import { PageShell } from "@/components/PageShell";
import { usePageText } from "@/lib/use-page-text";
import { monthlyId, pad2 } from "@/lib/year";

export const Route = createFileRoute("/monthly/$year/$month")({
  head: () => ({
    meta: [
      { title: "월간 플랜 — LH 업무수첩" },
      { name: "description", content: "월별 일정과 목표를 손글씨로 기록하는 월간 플랜." },
      { property: "og:title", content: "월간 플랜 — LH 업무수첩" },
      { property: "og:description", content: "달력·체크리스트와 함께 월간 계획을 남기세요." },
    ],
  }),
  component: MonthlyPage,
});

function MonthlyPage() {
  const { year, month } = Route.useParams();
  const y = Number(year);
  const m = Number(month);
  const id = monthlyId(y, m);
  const { fields, setField, status } = usePageText(id, "monthly");

  return (
    <PageShell
      title={`${y}년 ${m}월 플랜`}
      subtitle={status === "saving" ? "저장 중…" : status === "saved" ? "저장됨" : "달력 · 체크리스트 · 메모"}
      wide
    >
      <div className="grid gap-4 lg:grid-cols-[320px_260px_1fr]">
        <MiniCalendar year={y} month={m} />
        <MonthlyChecklist
          value={fields["checklist"]}
          onChange={(next) => setField("checklist", next)}
        />
        <HandwritingCanvas pageId={id} pageType="monthly" grid minHeight={520} label="월간 메모" />
      </div>
    </PageShell>
  );
}
