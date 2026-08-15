import { createFileRoute } from "@tanstack/react-router";

import { HandwritingCanvas } from "@/components/HandwritingCanvas";
import { PageShell } from "@/components/PageShell";
import { usePageText } from "@/lib/use-page-text";
import { useSelectedYear } from "@/lib/year";

export const Route = createFileRoute("/meetings")({
  head: () => ({
    meta: [
      { title: "회의록 — LH 업무수첩" },
      { name: "description", content: "회의 일시·참석자·안건을 적고 본문은 필기로 남기는 회의록." },
      { property: "og:title", content: "회의록 — LH 업무수첩" },
      { property: "og:description", content: "회의 정보 입력과 필기 기록을 한 화면에서." },
    ],
  }),
  component: MeetingsPage,
});

function MeetingsPage() {
  const { year } = useSelectedYear();
  const id = `meeting-${year}`;
  const { fields, setField, status } = usePageText(id, "meeting");

  return (
    <PageShell
      title="회의록"
      subtitle={status === "saving" ? "저장 중…" : status === "saved" ? "저장됨" : `${year}년`}
      wide
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        {(["일시 / 장소", "참석자", "안건"] as const).map((k) => (
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
      <HandwritingCanvas pageId={id} pageType="meeting" grid minHeight={600} label="회의 내용" />
    </PageShell>
  );
}
