import { createFileRoute } from "@tanstack/react-router";

import { StaticPage } from "@/components/StaticPage";
import { STRATEGY } from "@/content/lh-content";

export const Route = createFileRoute("/strategy")({
  head: () => ({
    meta: [
      { title: "중장기 경영전략 체계도 — LH 업무수첩" },
      { name: "description", content: "LH의 Mission, Vision, 슬로건, 5대 가치와 전략목표." },
      { property: "og:title", content: "중장기 경영전략 체계도 — LH 업무수첩" },
      { property: "og:description", content: "Mission·Vision·5대 가치·전략목표 한눈에 보기." },
    ],
  }),
  component: StrategyPage,
});

function StrategyPage() {
  return (
    <StaticPage slug="strategy" title="중장기 경영전략 체계도" subtitle="KOREA LAND & HOUSING CORPORATION">
      <div className="space-y-4">
        <Block label="Mission" text={STRATEGY.mission} tone="primary" />
        <Block label="Vision" text={STRATEGY.vision} />
        <Block label="Slogan" text={STRATEGY.slogan} />

        <div>
          <h2 className="mb-2 text-sm font-semibold text-muted-foreground">5대 가치</h2>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {STRATEGY.values.map((v) => (
              <li
                key={v.ko}
                className="rounded-xl border border-border bg-card px-3 py-4 text-center"
              >
                <p className="text-base font-bold text-primary">{v.ko}</p>
                <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                  {v.en}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-muted-foreground">전략목표</h2>
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {STRATEGY.goals.map((g) => (
              <li key={g.title} className="rounded-xl border border-border bg-card p-4">
                <p className="mb-2 font-semibold text-foreground">{g.title}</p>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  {g.tasks.map((t) => (
                    <li key={t} className="flex gap-1.5">
                      <span className="text-primary">·</span>
                      {t}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </StaticPage>
  );
}

function Block({ label, text, tone }: { label: string; text: string; tone?: "primary" }) {
  return (
    <div
      className={
        tone === "primary"
          ? "rounded-xl bg-primary p-4 text-primary-foreground"
          : "rounded-xl border border-border bg-card p-4"
      }
    >
      <p
        className={
          tone === "primary"
            ? "text-xs uppercase tracking-widest opacity-80"
            : "text-xs uppercase tracking-widest text-muted-foreground"
        }
      >
        {label}
      </p>
      <p className="mt-1 text-base font-medium leading-relaxed">{text}</p>
    </div>
  );
}
