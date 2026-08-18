import { createFileRoute, Link } from "@tanstack/react-router";

import { BRAND } from "@/content/lh-content";
import { useRestoreLastRoute } from "@/lib/last-route";
import { useSelectedYear, yearOptions } from "@/lib/year";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LH 디지털 업무수첩 — 오프라인 다이어리" },
      {
        name: "description",
        content:
          "LH 직원용 오프라인 업무수첩. 펜 필기, 월간·일간 플랜, 회의록, 연락처를 기기 안에만 저장합니다.",
      },
      { property: "og:title", content: "LH 디지털 업무수첩" },
      {
        property: "og:description",
        content: "오프라인 전용 업무수첩 — 필기·월간·일간 플랜을 기기에 저장합니다.",
      },
    ],
  }),
  component: Cover,
});

function Cover() {
  const { year, setYear } = useSelectedYear();
  useRestoreLastRoute();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-primary px-6 py-16 text-primary-foreground">
      <p className="text-sm tracking-[0.4em] uppercase opacity-80">{BRAND.slogan}</p>
      <h1 className="mt-6 text-7xl font-black leading-none tracking-tight sm:text-8xl">
        {year}
      </h1>
      <p className="mt-2 text-3xl font-light tracking-[0.2em] lowercase">
        {BRAND.bookTitle}
      </p>
      <p className="mt-8 text-xs tracking-widest opacity-70">{BRAND.orgEn}</p>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
        {yearOptions().map((y) => (
          <button
            key={y}
            type="button"
            onClick={() => setYear(y)}
            className={
              y === year
                ? "rounded-full bg-primary-foreground px-4 py-2 text-sm font-semibold text-primary"
                : "rounded-full border border-primary-foreground/40 px-4 py-2 text-sm text-primary-foreground/80"
            }
          >
            {y}
          </button>
        ))}
      </div>

      <Link
        to="/contents"
        className="mt-10 rounded-xl bg-primary-foreground px-8 py-3 text-base font-semibold text-primary"
      >
        수첩 열기
      </Link>
    </main>
  );
}
