import { type ReactNode } from "react";

import { HandwritingCanvas } from "@/components/HandwritingCanvas";
import { PageShell } from "@/components/PageShell";

interface Props {
  slug: string;
  title: string;
  subtitle?: string | undefined;
  children: ReactNode;
}

/** 고정 콘텐츠 페이지: 입력 필드가 없으므로 전면 필기 오버레이를 사용합니다. */
export function StaticPage({ slug, title, subtitle, children }: Props) {
  return (
    <PageShell title={title} subtitle={subtitle} wide>
      <div className="relative">
        <div className="pb-16">{children}</div>
        <HandwritingCanvas
          pageId={`static-${slug}`}
          pageType="static"
          overlay
          label="필기"
        />
      </div>
    </PageShell>
  );
}
