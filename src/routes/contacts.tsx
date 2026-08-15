import { createFileRoute } from "@tanstack/react-router";

import { HandwritingCanvas } from "@/components/HandwritingCanvas";
import { PageShell } from "@/components/PageShell";
import { useSelectedYear } from "@/lib/year";

export const Route = createFileRoute("/contacts")({
  head: () => ({
    meta: [
      { title: "연락처 카드 — LH 업무수첩" },
      { name: "description", content: "이름·소속·연락처를 손글씨로 남기는 연락처 페이지." },
      { property: "og:title", content: "연락처 카드 — LH 업무수첩" },
      { property: "og:description", content: "자주 연락하는 담당자를 필기로 정리하세요." },
    ],
  }),
  component: ContactsPage,
});

function ContactsPage() {
  const { year } = useSelectedYear();
  return (
    <PageShell title="연락처 카드" subtitle={`${year}년 연락처`} wide>
      <HandwritingCanvas
        pageId={`contact-${year}`}
        pageType="contact"
        grid
        minHeight={700}
        label="연락처"
      />
    </PageShell>
  );
}
