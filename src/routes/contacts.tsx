import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { DocList } from "@/components/DocList";
import { HandwritingCanvas } from "@/components/HandwritingCanvas";
import { PageShell } from "@/components/PageShell";
import { docTitle, useDocList } from "@/lib/use-doc-list";
import { usePageText } from "@/lib/use-page-text";

export const Route = createFileRoute("/contacts")({
  validateSearch: (search: Record<string, unknown>) => ({
    id: typeof search["id"] === "string" ? (search["id"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "연락처 카드 — LH 업무수첩" },
      { name: "description", content: "성명·소속·직위·연락처를 카드로 정리하는 연락처 페이지." },
      { property: "og:title", content: "연락처 카드 — LH 업무수첩" },
      { property: "og:description", content: "자주 연락하는 담당자를 카드별로 정리하세요." },
    ],
  }),
  component: ContactsPage,
});

const FIELDS = ["소속", "직위 / 직급", "연락처", "이메일"] as const;

function ContactsPage() {
  const { id } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { docs, loaded, refresh, create, remove } = useDocList("contact");

  const selected = docs.find((d) => d.id === id);

  useEffect(() => {
    if (!loaded) return;
    if (!id && docs[0]) void navigate({ search: { id: docs[0].id }, replace: true });
    if (id && !docs.some((d) => d.id === id))
      void navigate({ search: { id: docs[0]?.id }, replace: true });
  }, [loaded, id, docs, navigate]);

  const handleCreate = async () => {
    const newDocId = await create({ 성명: "" });
    void navigate({ search: { id: newDocId } });
  };

  return (
    <PageShell title="연락처 카드" subtitle="선택한 카드만 필기 영역이 열립니다" wide>
      <div className="grid gap-4 md:grid-cols-[16rem_1fr]">
        <DocList
          items={docs.map((d) => ({
            id: d.id,
            title: docTitle(d, "연락처", "성명"),
            sub:
              [d.textFields?.["소속"], d.textFields?.["연락처"]].filter(Boolean).join(" · ") ||
              undefined,
          }))}
          selectedId={id}
          onSelect={(next) => void navigate({ search: { id: next } })}
          onCreate={() => void handleCreate()}
          onDelete={(target) => void remove(target)}
          addLabel="새 연락처"
          emptyLabel="연락처가 없습니다. 새로 추가하세요."
        />

        {selected ? (
          <ContactDetail key={selected.id} pageId={selected.id} onFieldBlur={() => void refresh()} />
        ) : (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            왼쪽에서 연락처를 선택하거나 새로 추가하세요.
          </div>
        )}
      </div>
    </PageShell>
  );
}

function ContactDetail({ pageId, onFieldBlur }: { pageId: string; onFieldBlur: () => void }) {
  const { fields, setField, status } = usePageText(pageId, "contact");

  return (
    <section>
      <div className="mb-3 flex items-center gap-3">
        <input
          value={fields["성명"] ?? ""}
          onChange={(e) => setField("성명", e.target.value)}
          onBlur={onFieldBlur}
          placeholder="성명"
          className="min-w-0 flex-1 rounded-xl border border-border bg-card px-3 py-2 text-base font-semibold text-foreground outline-none focus:border-primary"
        />
        <span className="shrink-0 text-xs text-muted-foreground">
          {status === "saving" ? "저장 중…" : status === "saved" ? "저장됨" : ""}
        </span>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        {FIELDS.map((k) => (
          <label key={k} className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">{k}</span>
            <input
              value={fields[k] ?? ""}
              onChange={(e) => setField(k, e.target.value)}
              onBlur={onFieldBlur}
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
            />
          </label>
        ))}
      </div>

      <HandwritingCanvas pageId={pageId} pageType="contact" grid minHeight={420} label="메모" />
    </section>
  );
}
