import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  CalendarDays,
  Link2,
  MapPin,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";
import { type ReactNode } from "react";

import { cn } from "@/lib/utils";
import { useSelectedYear } from "@/lib/year";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const NAV: NavItem[] = [
  { to: "/contents", label: "목차", icon: BookOpen },
  { to: "/links", label: "링크", icon: Link2 },
  { to: "/calendar", label: "달력", icon: CalendarDays },
  { to: "/contacts", label: "연락처", icon: Users },
  { to: "/family", label: "지역본부", icon: MapPin },
  { to: "/settings", label: "설정", icon: Settings },
];

interface Props {
  title: string;
  subtitle?: string | undefined;
  actions?: ReactNode;
  children: ReactNode;
  /** 콘텐츠 폭 제한 해제 */
  wide?: boolean;
}

export function PageShell({ title, subtitle, actions, children, wide }: Props) {
  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8 md:pl-20">
      <QuickNav />
      <div className={cn("mx-auto px-4 pt-4 md:px-8", wide ? "max-w-[1400px]" : "max-w-5xl")}>
        <header className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-border pb-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
            {subtitle ? (
              <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </header>
        {children}
      </div>
    </div>
  );
}

const ITEM_CLASS =
  "flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] text-muted-foreground transition-colors hover:text-foreground md:flex-none";
const ACTIVE_PROPS = { className: "text-primary bg-secondary" };

function QuickNav() {
  const { year } = useSelectedYear();

  return (
    <nav
      aria-label="빠른 이동"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-border bg-card/95 px-2 py-1.5 backdrop-blur",
        "md:inset-y-0 md:right-auto md:left-0 md:w-20 md:flex-col md:justify-start md:gap-1 md:border-t-0 md:border-r md:py-4",
      )}
    >
      <Link
        to="/"
        className="hidden items-center justify-center rounded-xl px-2 py-3 text-[11px] font-bold text-primary md:flex"
      >
        LH
      </Link>
      {NAV.map(({ to, label, icon: Icon }) =>
        to === "/calendar" ? (
          <Link
            key={to}
            to="/calendar/$year"
            params={{ year: String(year) }}
            activeProps={ACTIVE_PROPS}
            className={ITEM_CLASS}
          >
            <Icon className="size-5" />
            {label}
          </Link>
        ) : (
          <Link key={to} to={to} activeProps={ACTIVE_PROPS} className={ITEM_CLASS}>
            <Icon className="size-5" />
            {label}
          </Link>
        ),
      )}
    </nav>
  );
}
