import { createFileRoute } from "@tanstack/react-router";

import { StaticPage } from "@/components/StaticPage";
import { REGIONAL_OFFICES } from "@/content/lh-content";

export const Route = createFileRoute("/family")({
  head: () => ({
    meta: [
      { title: "LH Family 지역본부 — LH 업무수첩" },
      { name: "description", content: "LH 지역본부 명칭과 주소 목록." },
      { property: "og:title", content: "LH Family 지역본부 — LH 업무수첩" },
      { property: "og:description", content: "전국 지역본부 주소를 오프라인에서 확인하세요." },
    ],
  }),
  component: FamilyPage,
});

function FamilyPage() {
  return (
    <StaticPage slug="family" title="LH Family 지역본부">
      <ul className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {REGIONAL_OFFICES.map((o) => (
          <li key={o.name} className="rounded-xl border border-border bg-card p-4">
            <p className="font-semibold text-foreground">{o.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">{o.address}</p>
          </li>
        ))}
      </ul>
    </StaticPage>
  );
}
