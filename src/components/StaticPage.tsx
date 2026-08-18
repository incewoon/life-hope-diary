import { type ReactNode } from "react";

import { PageShell } from "@/components/PageShell";

interface Props {
  slug: string;
  title: string;
  subtitle?: string | undefined;
  children: ReactNode;
}

/** 고정 콘텐츠 페이지: 읽기 전용으로 콘텐츠만 표시합니다(필기 없음). */
export function StaticPage({ title, subtitle, children }: Props) {
  return (
    <PageShell title={title} subtitle={subtitle} wide>
      {children}
    </PageShell>
  );
}
