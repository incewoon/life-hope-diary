import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { CalendarDays, Clock } from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => ({
  hour: Math.floor(i / 2),
  minute: i % 2 === 0 ? 0 : 30,
}));

export function withTime(date: Date, hour: number, minute: number): Date {
  const next = new Date(date);
  next.setHours(hour, minute, 0, 0);
  return next;
}

/** 날짜(캘린더) + 시간(30분 단위) 선택 한 줄 */
export function DateTimeRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Date;
  onChange: (d: Date) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-border px-3 py-2">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        <Popover>
          <PopoverTrigger className="flex items-center gap-1.5 rounded-lg bg-secondary px-2.5 py-1.5 text-sm text-foreground">
            <CalendarDays className="size-3.5 text-muted-foreground" />
            {format(value, "yyyy. M. d (E)", { locale: ko })}
          </PopoverTrigger>
          <PopoverContent align="end" className="w-auto p-0">
            <Calendar
              mode="single"
              selected={value}
              onSelect={(d) => {
                if (!d) return;
                onChange(withTime(d, value.getHours(), value.getMinutes()));
              }}
              locale={ko}
              className={cn("pointer-events-auto p-3")}
            />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger className="flex items-center gap-1.5 rounded-lg bg-secondary px-2.5 py-1.5 text-sm text-foreground">
            <Clock className="size-3.5 text-muted-foreground" />
            {format(value, "a h:mm", { locale: ko })}
          </PopoverTrigger>
          <PopoverContent align="end" className="max-h-64 w-36 overflow-y-auto p-1">
            {TIME_SLOTS.map(({ hour, minute }) => {
              const active = value.getHours() === hour && value.getMinutes() === minute;
              return (
                <button
                  key={`${hour}:${minute}`}
                  type="button"
                  onClick={() => onChange(withTime(value, hour, minute))}
                  className={cn(
                    "w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-secondary",
                    active && "bg-primary text-primary-foreground hover:bg-primary",
                  )}
                >
                  {format(withTime(value, hour, minute), "a h:mm", { locale: ko })}
                </button>
              );
            })}
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
