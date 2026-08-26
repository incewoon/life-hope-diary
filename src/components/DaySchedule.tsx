import { useMemo, useState } from "react";
import { addHours, format } from "date-fns";
import { ko } from "date-fns/locale";
import { CalendarPlus, Clock, CalendarDays, Trash2 } from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface ScheduleItem {
  id: string;
  /** 시작 ISO datetime */
  at: string;
  /** 종료 ISO datetime (없으면 시작 +1시간) */
  end?: string;
  title: string;
}

export function scheduleEnd(item: ScheduleItem): Date {
  const start = new Date(item.at);
  if (item.end) {
    const e = new Date(item.end);
    if (!Number.isNaN(e.getTime())) return e;
  }
  return addHours(start, 1);
}

export function parseSchedule(raw: string | undefined): ScheduleItem[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .flatMap((entry): ScheduleItem[] => {
        if (typeof entry !== "object" || entry === null) return [];
        const item = entry as Partial<ScheduleItem>;
        if (typeof item.id !== "string" || typeof item.at !== "string") return [];
        if (Number.isNaN(new Date(item.at).getTime())) return [];
        const base: ScheduleItem = {
          id: item.id,
          at: item.at,
          title: typeof item.title === "string" ? item.title : "",
        };
        if (typeof item.end === "string" && !Number.isNaN(new Date(item.end).getTime())) {
          base.end = item.end;
        }
        return [base];
      })
      .sort((a, b) => a.at.localeCompare(b.at));
  } catch {
    return [];
  }
}

/** 현재 시각을 30분 단위로 올림 */
function roundUpHalfHour(base: Date): Date {
  const d = new Date(base);
  const now = new Date();
  d.setHours(now.getHours(), now.getMinutes() >= 30 ? 60 : 30, 0, 0);
  return d;
}

interface Props {
  /** 현재 보고 있는 날짜 (새 일정 기본값) */
  baseDate: Date;
  value: string | undefined;
  onChange: (serialized: string) => void;
}

export function DaySchedule({ baseDate, value, onChange }: Props) {
  const items = useMemo(() => parseSchedule(value), [value]);
  const [editing, setEditing] = useState<ScheduleItem | null>(null);
  const [open, setOpen] = useState(false);

  const commit = (next: ScheduleItem[]) =>
    onChange(JSON.stringify([...next].sort((a, b) => a.at.localeCompare(b.at))));

  const openNew = () => {
    const start = roundUpHalfHour(baseDate);
    setEditing({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      at: start.toISOString(),
      end: addHours(start, 1).toISOString(),
      title: "",
    });
    setOpen(true);
  };

  const save = (item: ScheduleItem) => {
    const exists = items.some((it) => it.id === item.id);
    commit(exists ? items.map((it) => (it.id === item.id ? item : it)) : [...items, item]);
    setOpen(false);
  };

  const remove = (id: string) => {
    commit(items.filter((it) => it.id !== id));
    setOpen(false);
  };

  return (
    <section className="mb-4 rounded-xl border border-border bg-card p-4">
      <h2 className="mb-3 text-sm font-bold tracking-widest text-primary uppercase">Schedule</h2>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={openNew}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
        >
          <CalendarPlus className="size-4" />새 일정
        </button>
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setEditing(item);
              setOpen(true);
            }}
            className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors hover:bg-secondary"
          >
            <span className="font-semibold text-primary">
              {format(new Date(item.at), "HH:mm")}–{format(scheduleEnd(item), "HH:mm")}
            </span>
            <span className="max-w-[16rem] truncate">{item.title || "제목 없음"}</span>
          </button>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>일정</DialogTitle>
          </DialogHeader>
          {editing ? (
            <ScheduleForm
              key={editing.id}
              initial={editing}
              canDelete={items.some((it) => it.id === editing.id)}
              onSave={save}
              onDelete={() => remove(editing.id)}
              onCancel={() => setOpen(false)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}

const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => ({
  hour: Math.floor(i / 2),
  minute: i % 2 === 0 ? 0 : 30,
}));

function withTime(date: Date, hour: number, minute: number): Date {
  const next = new Date(date);
  next.setHours(hour, minute, 0, 0);
  return next;
}

function DateTimeRow({
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

function ScheduleForm({
  initial,
  canDelete,
  onSave,
  onDelete,
  onCancel,
}: {
  initial: ScheduleItem;
  canDelete: boolean;
  onSave: (item: ScheduleItem) => void;
  onDelete: () => void;
  onCancel: () => void;
}) {
  const [start, setStart] = useState<Date>(new Date(initial.at));
  const [end, setEnd] = useState<Date>(scheduleEnd(initial));
  const [title, setTitle] = useState(initial.title);

  const changeStart = (d: Date) => {
    setStart(d);
    if (end.getTime() <= d.getTime()) setEnd(addHours(d, 1));
  };

  return (
    <div className="flex flex-col gap-3">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="일정 이름"
        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-base text-foreground outline-none focus:border-primary"
      />

      <DateTimeRow label="시작" value={start} onChange={changeStart} />
      <DateTimeRow
        label="종료"
        value={end}
        onChange={(d) => setEnd(d.getTime() <= start.getTime() ? addHours(start, 1) : d)}
      />

      <DialogFooter className="gap-2 sm:justify-between">
        {canDelete ? (
          <button
            type="button"
            onClick={onDelete}
            className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm text-destructive"
          >
            <Trash2 className="size-4" />
            삭제
          </button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-border px-4 py-2 text-sm text-foreground"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() =>
              onSave({
                ...initial,
                at: start.toISOString(),
                end: end.toISOString(),
                title: title.trim(),
              })
            }
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            저장
          </button>
        </div>
      </DialogFooter>
    </div>
  );
}
