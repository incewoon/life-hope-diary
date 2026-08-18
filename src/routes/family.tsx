import { createFileRoute } from "@tanstack/react-router";

import { PageShell } from "@/components/PageShell";
import { REGIONAL_OFFICES } from "@/content/lh-content";
import { usePageText } from "@/lib/use-page-text";

export const Route = createFileRoute("/family")({
  head: () => ({
    meta: [
      { title: "LH Family 지역본부 — LH 업무수첩" },
      { name: "description", content: "LH 지역본부 명칭·주소와 내 사무실 정보를 정리합니다." },
      { property: "og:title", content: "LH Family 지역본부 — LH 업무수첩" },
      { property: "og:description", content: "전국 지역본부 주소와 내 사무실 정보를 오프라인에서 확인하세요." },
    ],
  }),
  component: FamilyPage,
});

const OFFICE_FIELDS = ["부서", "전화", "팩스", "이메일", "주소"] as const;

function FamilyPage() {
  const { fields, setField, status } = usePageText("static-family", "static");

  return (
    <PageShell
      title="LH Family 지역본부"
      subtitle={status === "saving" ? "저장 중…" : status === "saved" ? "저장됨" : undefined}
      wide
    >
      <div className="relative">
        <div className="pb-16">
          <ul className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {REGIONAL_OFFICES.map((o) => (
              <li key={o.name} className="rounded-xl border border-border bg-card p-4">
                <p className="font-semibold text-foreground">{o.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{o.address}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 입력 영역은 필기 레이어 바깥에 배치해 겹침을 방지합니다 */}
      <section className="mt-6 rounded-xl border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-bold tracking-widest text-primary uppercase">My Office</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {OFFICE_FIELDS.map((k) => (
            <label key={k} className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">{k}</span>
              <input
                value={fields[k] ?? ""}
                onChange={(e) => setField(k, e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              />
            </label>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
