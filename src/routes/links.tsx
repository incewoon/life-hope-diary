import { createFileRoute } from "@tanstack/react-router";

import { StaticPage } from "@/components/StaticPage";
import { LINK_GROUPS } from "@/content/lh-content";

export const Route = createFileRoute("/links")({
  head: () => ({
    meta: [
      { title: "LH 링크·앱 안내 — LH 업무수첩" },
      { name: "description", content: "LH 홈페이지, 청약, 업무 시스템 주소 오프라인 안내." },
      { property: "og:title", content: "LH 링크·앱 안내 — LH 업무수첩" },
      { property: "og:description", content: "자주 쓰는 LH 사이트와 앱 주소 모음." },
    ],
  }),
  component: LinksPage,
});

function LinksPage() {
  return (
    <StaticPage slug="links" title="LH 링크·앱 안내" subtitle="오프라인 앱이므로 주소만 안내합니다">
      <div className="grid gap-3 md:grid-cols-3">
        {LINK_GROUPS.map((g) => (
          <section key={g.group} className="rounded-xl border border-border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold text-primary">{g.group}</h2>
            <ul className="space-y-2">
              {g.items.map((it) => (
                <li key={it.name} className="border-b border-border/60 pb-2 last:border-0">
                  <p className="text-sm font-medium text-foreground">{it.name}</p>
                  <p className="text-xs text-muted-foreground">{it.note}</p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </StaticPage>
  );
}
