import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  eachDayOfInterval,
  endOfMonth,
  getDay,
  isSameDay,
  startOfMonth,
} from "date-fns";

import { listScheduleDays } from "@/lib/schedule";
import { cn } from "@/lib/utils";
import { pad2 } from "@/lib/year";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

const MONTH_EN = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function MiniCalendar({ year, month }: { year: number; month: number }) {
  const first = startOfMonth(new Date(year, month - 1, 1));
  const days = eachDayOfInterval({ start: first, end: endOfMonth(first) });
  const lead = getDay(first);
  const today = new Date();
  const [scheduleDays, setScheduleDays] = useState<Set<number>>(() => new Set());

  useEffect(() => {
    let alive = true;
    listScheduleDays(year, month)
      .then((set) => alive && setScheduleDays(set))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [year, month]);

  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="mb-2 flex items-baseline gap-2">
        <span className="text-lg font-bold text-primary">{month}</span>
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          {MONTH_EN[month - 1]}
        </span>
        <Link
          to="/monthly/$year/$month"
          params={{ year: String(year), month: pad2(month) }}
          className="ml-auto text-[11px] text-muted-foreground underline-offset-2 hover:underline"
        >
          월간
        </Link>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center text-[11px] text-muted-foreground">
        {WEEKDAYS.map((w, i) => (
          <div key={w} className={cn(i === 0 && "text-destructive", i === 6 && "text-primary")}>
            {w}
          </div>
        ))}
        {Array.from({ length: lead }).map((_, i) => (
          <div key={`lead-${i}`} />
        ))}
        {days.map((day) => {
          const d = day.getDate();
          const dow = day.getDay();
          const isToday = isSameDay(day, today);
          const hasSchedule = scheduleDays.has(d);
          return (
            <Link
              key={d}
              to="/daily/$year/$month/$day"
              params={{ year: String(year), month: pad2(month), day: pad2(d) }}
              className="mx-auto flex flex-col items-center gap-0"
            >
              <span
                className={cn(
                  "size-1 rounded-full mb-0.5",
                  hasSchedule ? "bg-primary" : "bg-transparent",
                )}
              />
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-full text-xs text-foreground hover:bg-secondary",
                  dow === 0 && "text-destructive",
                  dow === 6 && "text-primary",
                  isToday && "bg-primary font-bold text-primary-foreground",
                )}
              >
                {d}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
