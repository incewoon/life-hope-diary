import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { DocList } from "@/components/DocList";
import { HandwritingCanvas } from "@/components/HandwritingCanvas";
import { PageShell } from "@/components/PageShell";
import { docTitle, useDocList } from "@/lib/use-doc-list";
import { usePageText } from "@/lib/use-page-text";

export const Route = createFileRoute("/meetings")({
  validateSearch: (search: Record<string, unknown>) => ({
    id: typeof search["id"] === "string" ? (search["id"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "회의록 — LH 업무수첩" },
      { name: "description", content: "회의 일시·참석자·안건을 적고 본문은 필기로 남기는 회의록." },
      { property: "og:title", content: "회의록 — LH 업무수첩" },
      { property: "og:description", content: "회의별로 기록을 나눠 저장하고 필기로 정리하세요." },
    ],
  }),
  component: MeetingsPage,
});



function MeetingsPage() {
  const { id } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { docs, loaded, refresh, create, remove } = useDocList("meeting");

  const selected = docs.find((d) => d.id === id);

  useEffect(() => {
    if (!loaded) return;
    if (!id && docs[0]) void navigate({ search: { id: docs[0].id }, replace: true });
    if (id && !docs.some((d) => d.id === id))
      void navigate({ search: { id: docs[0]?.id }, replace: true });
  }, [loaded, id, docs, navigate]);

  const handleCreate = async () => {
    const newDocId = await create({ 회의명: "" });
    void navigate({ search: { id: newDocId } });
  };

  return (
    <PageShell title="회의록" subtitle="회의별로 나눠 기록합니다" wide>
      <div className="grid gap-4 md:grid-cols-[16rem_1fr]">
        <DocList
          items={docs.map((d) => ({
            id: d.id,
            title: docTitle(d, "회의록", "회의명"),
            sub: d.textFields?.["일시 / 장소"] || undefined,
          }))}
          selectedId={id}
          onSelect={(next) => void navigate({ search: { id: next } })}
          onCreate={() => void handleCreate()}
          onDelete={(target) => void remove(target)}
          addLabel="새 회의록"
          emptyLabel="회의록이 없습니다. 새로 추가하세요."
        />

        {selected ? (
          <MeetingDetail key={selected.id} pageId={selected.id} onTitleBlur={() => void refresh()} />
        ) : (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            왼쪽에서 회의록을 선택하거나 새로 추가하세요.
          </div>
        )}
      </div>
    </PageShell>
  );
}

function MeetingDetail({
  pageId,
  onTitleBlur,
}: {
  pageId: string;
  onTitleBlur: () => void;
}) {
  const { fields, setField, status } = usePageText(pageId, "meeting");

  return (
    <section>
      <div className="mb-3 flex items-center gap-3">
        <input
          value={fields["회의명"] ?? ""}
          onChange={(e) => setField("회의명", e.target.value)}
          onBlur={onTitleBlur}
          placeholder="회의명"
          className="min-w-0 flex-1 rounded-xl border border-border bg-card px-3 py-2 text-base font-semibold text-foreground outline-none focus:border-primary"
        />
        <span className="shrink-0 text-xs text-muted-foreground">
          {status === "saving" ? "저장 중…" : status === "saved" ? "저장됨" : ""}
        </span>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div>
          <span className="mb-1 block text-xs font-medium text-muted-foreground">일시</span>
          <MeetingDateTime
            value={fields["datetime"] ?? ""}
            onChange={(iso) => setField("datetime", iso)}
          />
        </div>
        {(["장소", "참석자"] as const).map((k) => (
          <label key={k} className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">{k}</span>
            <input
              value={fields[k] ?? ""}
              onChange={(e) => setField(k, e.target.value)}
              placeholder={k}
              className="h-[42px] w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground outline-none focus:border-primary"
            />
          </label>
        ))}
      </div>

      <MeetingRecorder
        meta={{
          title: fields["회의명"] ?? "",
          datetime: formatMeetingDate(fields["datetime"]),
          place: fields["장소"] ?? "",
          attendees: fields["참석자"] ?? "",
        }}
      />

      <HandwritingCanvas pageId={pageId} pageType="meeting" grid minHeight={520} label="회의 내용" />
    </section>
  );
}
