import { createFileRoute } from "@tanstack/react-router";

import { StaticPage } from "@/components/StaticPage";
import { MANAGEMENT_GOALS, MANAGEMENT_INTRO } from "@/content/lh-content";

export const Route = createFileRoute("/goals")({
  head: () => ({
    meta: [
      { title: "8대 경영목표 — LH 업무수첩" },
      { name: "description", content: "주택공급 100만호부터 고객만족 BEST까지 LH 8대 경영목표." },
      { property: "og:title", content: "8대 경영목표 — LH 업무수첩" },
      { property: "og:description", content: "LH 중기 경영목표 8종을 카드로 정리했습니다." },
    ],
  }),
  component: GoalsPage,
});

function GoalsPage() {
  return (
    <StaticPage slug="goals" title="8대 경영목표" subtitle={MANAGEMENT_INTRO}>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {MANAGEMENT_GOALS.map((g) => (
          <li key={g.label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-medium text-muted-foreground">{g.label}</p>
            <p className="mt-1 text-2xl font-black text-primary">{g.value}</p>
            <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
              {g.details.map((d) => (
                <li key={d} className="flex gap-1.5">
                  <span className="text-accent">·</span>
                  {d}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </StaticPage>
  );
}
