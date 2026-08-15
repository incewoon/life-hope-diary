import { createFileRoute } from "@tanstack/react-router";

import { StaticPage } from "@/components/StaticPage";
import { COMPLIANCE_INTRO, COMPLIANCE_ITEMS } from "@/content/lh-content";

export const Route = createFileRoute("/compliance")({
  head: () => ({
    meta: [
      { title: "부패방지 및 규범준수 방침 — LH 업무수첩" },
      { name: "description", content: "LH 청렴윤리경영 실천을 위한 7개 부패방지·규범준수 방침." },
      { property: "og:title", content: "부패방지 및 규범준수 방침 — LH 업무수첩" },
      { property: "og:description", content: "청렴윤리경영 7개 실천 항목." },
    ],
  }),
  component: CompliancePage,
});

function CompliancePage() {
  return (
    <StaticPage slug="compliance" title="부패방지 및 규범준수 방침">
      <p className="mb-4 rounded-xl border border-border bg-card p-4 text-sm leading-relaxed text-muted-foreground">
        {COMPLIANCE_INTRO}
      </p>
      <ol className="space-y-2">
        {COMPLIANCE_ITEMS.map((item, i) => (
          <li key={item} className="flex gap-3 rounded-xl border border-border bg-card p-4">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              {i + 1}
            </span>
            <p className="text-sm leading-relaxed text-foreground">{item}</p>
          </li>
        ))}
      </ol>
    </StaticPage>
  );
}
