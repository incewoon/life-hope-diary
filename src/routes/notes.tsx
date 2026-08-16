import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { DocList } from "@/components/DocList";
import { HandwritingCanvas } from "@/components/HandwritingCanvas";
import { PageShell } from "@/components/PageShell";
import { docTitle, useDocList } from "@/lib/use-doc-list";
import { usePageText } from "@/lib/use-page-text";

export const Route = createFileRoute("/notes")({
  validateSearch: (search: Record<string, unknown>) => ({
    id: typeof search["id"] === "string" ? (search["id"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "자유 격자 노트 — LH 업무수첩" },
      { name: "description", content: "모눈 배경 위에 자유롭게 필기하는 여러 개의 노트." },
      { property: "og:title", content: "자유 격자 노트 — LH 업무수첩" },
      { property: "og:description", content: "노트를 여러 개 만들어 주제별로 기록하세요." },
    ],
  }),
  component: NotesPage,
});

function NotesPage() {
  const { id } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { docs, loaded, refresh, create, remove } = useDocList("note");

  const selected = docs.find((d) => d.id === id);

  useEffect(() => {
    if (!loaded) return;
    if (!id && docs[0]) void navigate({ search: { id: docs[0].id }, replace: true });
    if (id && !docs.some((d) => d.id === id))
      void navigate({ search: { id: docs[0]?.id }, replace: true });
  }, [loaded, id, docs, navigate]);

  const handleCreate = async () => {
    const newDocId = await create({ 제목: "" });
    void navigate({ search: { id: newDocId } });
  };

  return (
    <PageShell title="자유 격자 노트" subtitle="주제별로 노트를 나눠 기록합니다" wide>
      <div className="grid gap-4 md:grid-cols-[16rem_1fr]">
        <DocList
          items={docs.map((d) => ({ id: d.id, title: docTitle(d, "노트", "제목") }))}
          selectedId={id}
          onSelect={(next) => void navigate({ search: { id: next } })}
          onCreate={() => void handleCreate()}
          onDelete={(target) => void remove(target)}
          addLabel="새 노트"
          emptyLabel="노트가 없습니다. 새로 추가하세요."
        />

        {selected ? (
          <NoteDetail key={selected.id} pageId={selected.id} onTitleBlur={() => void refresh()} />
        ) : (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            왼쪽에서 노트를 선택하거나 새로 추가하세요.
          </div>
        )}
      </div>
    </PageShell>
  );
}

function NoteDetail({ pageId, onTitleBlur }: { pageId: string; onTitleBlur: () => void }) {
  const { fields, setField, status } = usePageText(pageId, "note");

  return (
    <section>
      <div className="mb-3 flex items-center gap-3">
        <input
          value={fields["제목"] ?? ""}
          onChange={(e) => setField("제목", e.target.value)}
          onBlur={onTitleBlur}
          placeholder="노트 제목"
          className="min-w-0 flex-1 rounded-xl border border-border bg-card px-3 py-2 text-base font-semibold text-foreground outline-none focus:border-primary"
        />
        <span className="shrink-0 text-xs text-muted-foreground">
          {status === "saving" ? "저장 중…" : status === "saved" ? "저장됨" : ""}
        </span>
      </div>
      <HandwritingCanvas pageId={pageId} pageType="note" grid minHeight={640} label="노트" />
    </section>
  );
}
