import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookMarked,
  CalendarDays,
  CalendarRange,
  ClipboardList,
  FileText,
  Grid3x3,
  Link2,
  MapPin,
  Settings,
  ShieldCheck,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react";

import { PageShell } from "@/components/PageShell";
import { pad2, useSelectedYear } from "@/lib/year";

export const Route = createFileRoute("/contents")({
  head: () => ({
    meta: [
      { title: "목차 — LH 디지털 업무수첩" },
      { name: "description", content: "업무수첩의 모든 페이지로 이동하는 목차입니다." },
      { property: "og:title", content: "목차 — LH 디지털 업무수첩" },
      { property: "og:description", content: "월간·일간 플랜, 회의록, 연락처로 이동합니다." },
    ],
  }),
  component: Contents,
});

interface Item {
  to: string;
  label: string;
  desc: string;
  icon: LucideIcon;
}

const STATIC_ITEMS: Item[] = [
  { to: "/strategy", label: "중장기 경영전략 체계도", desc: "Mission·Vision·5대 가치", icon: Target },
  { to: "/goals", label: "8대 경영목표", desc: "중기 경영목표 요약", icon: ClipboardList },
  { to: "/compliance", label: "부패방지 및 규범준수 방침", desc: "7개 실천 항목", icon: ShieldCheck },
  { to: "/links", label: "LH 링크·앱 안내", desc: "오프라인 안내 전용", icon: Link2 },
];

const TOOL_ITEMS: Item[] = [
  { to: "/notes", label: "자유 격자 노트", desc: "모눈 필기 노트 추가·삭제", icon: Grid3x3 },
  { to: "/meetings", label: "회의록", desc: "회의 정보 + 필기", icon: FileText },
  { to: "/contacts", label: "연락처 카드", desc: "이름·소속·메모 필기", icon: Users },
  { to: "/family", label: "LH Family 지역본부", desc: "지역본부 주소 및 내 사무실", icon: MapPin },
  { to: "/settings", label: "설정 · 백업", desc: "백업 내보내기 / 가져오기", icon: Settings },
];

function Contents() {
  const { year } = useSelectedYear();
  const today = new Date();

  return (
    <PageShell title="목차" subtitle={`${year}년 업무수첩`}>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Link
          to="/calendar/$year"
          params={{ year: String(year) }}
          className="rounded-xl border border-border bg-primary/5 p-4 transition-colors hover:bg-primary/10"
        >
          <CalendarRange className="mb-2 size-5 text-primary" />
          <p className="font-semibold text-foreground">연간 달력</p>
          <p className="text-xs text-muted-foreground">{year}년 1~12월</p>
        </Link>
        <Link
          to="/monthly/$year/$month"
          params={{ year: String(year), month: pad2(today.getMonth() + 1) }}
          className="rounded-xl border border-border bg-primary/5 p-4 transition-colors hover:bg-primary/10"
        >
          <BookMarked className="mb-2 size-5 text-primary" />
          <p className="font-semibold text-foreground">월간 플랜</p>
          <p className="text-xs text-muted-foreground">이번 달 바로가기</p>
        </Link>
        <Link
          to="/daily/$year/$month/$day"
          params={{
            year: String(year),
            month: pad2(today.getMonth() + 1),
            day: pad2(today.getDate()),
          }}
          className="rounded-xl border border-border bg-primary/5 p-4 transition-colors hover:bg-primary/10"
        >
          <CalendarDays className="mb-2 size-5 text-primary" />
          <p className="font-semibold text-foreground">일간 플랜</p>
          <p className="text-xs text-muted-foreground">오늘 바로가기</p>
        </Link>
      </div>

      <Section title="고정 안내 페이지" items={STATIC_ITEMS} />
      <Section title="기록 도구" items={TOOL_ITEMS} />
    </PageShell>
  );
}

function Section({ title, items }: { title: string; items: Item[] }) {
  return (
    <section className="mb-6">
      <h2 className="mb-2 text-sm font-semibold text-muted-foreground">{title}</h2>
      <ul className="grid gap-2 sm:grid-cols-2">
        {items.map(({ to, label, desc, icon: Icon }) => (
          <li key={to}>
            <Link
              to={to}
              className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-secondary"
            >
              <Icon className="mt-0.5 size-5 shrink-0 text-primary" />
              <span>
                <span className="block font-medium text-foreground">{label}</span>
                <span className="block text-xs text-muted-foreground">{desc}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
