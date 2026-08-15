import { createFileRoute } from "@tanstack/react-router";

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

function DailyPage() {
  const { year, month, day } = Route.useParams();
  const y = Number(year);
  const m = Number(month);
  const d = Number(day);
  const id = dailyId(y, m, d);
  const { fields, setField, status } = usePageText(id, "daily");

  return (
    <PageShell
      title={`${y}년 ${m}월 ${d}일`}
      subtitle={status === "saving" ? "저장 중…" : status === "saved" ? "저장됨" : "일간 플랜"}
      wide
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        {(["오늘의 목표", "핵심 일정", "체크 사항"] as const).map((k) => (
          <label key={k} className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">{k}</span>
            <textarea
              value={fields[k] ?? ""}
              onChange={(e) => setField(k, e.target.value)}
              rows={3}
              className="w-full resize-none rounded-xl border border-border bg-card p-3 text-sm text-foreground outline-none focus:border-primary"
            />
          </label>
        ))}
      </div>
      <HandwritingCanvas pageId={id} pageType="daily" grid minHeight={560} label="자유 필기" />
    </PageShell>
  );
}
