import { createFileRoute } from "@tanstack/react-router";

import { HandwritingCanvas } from "@/components/HandwritingCanvas";
import { PageShell } from "@/components/PageShell";
import { useSelectedYear } from "@/lib/year";

export const Route = createFileRoute("/notes")({
  head: () => ({
    meta: [
      { title: "자유 격자 노트 — LH 업무수첩" },
      { name: "description", content: "모눈 배경 위에 자유롭게 필기하는 노트 페이지." },
      { property: "og:title", content: "자유 격자 노트 — LH 업무수첩" },
      { property: "og:description", content: "회의 스케치와 아이디어를 모눈 위에 기록하세요." },
    ],
  }),
  component: NotesPage,
});

function NotesPage() {
  const { year } = useSelectedYear();
  return (
    <PageShell title="자유 격자 노트" subtitle={`${year}년 노트`} wide>
      <HandwritingCanvas pageId={`note-${year}`} pageType="note" grid minHeight={700} label="노트" />
    </PageShell>
  );
}
