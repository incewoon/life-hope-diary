import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { CalendarPlus, Trash2 } from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface ScheduleItem {
  id: string;
  /** ISO datetime */
  at: string;
  title: string;
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
        return [{ id: item.id, at: item.at, title: typeof item.title === "string" ? item.title : "" }];
      })
      .sort((a, b) => a.at.localeCompare(b.at));
  } catch {
    return [];
  }
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
    const at = new Date(baseDate);
    at.setHours(9, 0, 0, 0);
    setEditing({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      at: at.toISOString(),
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
        {items.map((item) => {
          const at = new Date(item.at);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setEditing(item);
                setOpen(true);
              }}
              className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors hover:bg-secondary"
            >
              <span className="font-semibold text-primary">{format(at, "HH:mm")}</span>
              <span className="max-w-[16rem] truncate">{item.title || "제목 없음"}</span>
            </button>
          );
        })}
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
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function ScheduleForm({
  initial,
  canDelete,
  onSave,
  onDelete,
}: {
  initial: ScheduleItem;
  canDelete: boolean;
  onSave: (item: ScheduleItem) => void;
  onDelete: () => void;
}) {
  const [date, setDate] = useState<Date>(new Date(initial.at));
  const [title, setTitle] = useState(initial.title);

  const setTime = (hour: number, minute: number) => {
    const next = new Date(date);
    next.setHours(hour, minute, 0, 0);
    setDate(next);
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-1 text-xs font-medium text-muted-foreground">날짜</p>
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => {
            if (!d) return;
            const next = new Date(d);
            next.setHours(date.getHours(), date.getMinutes(), 0, 0);
            setDate(next);
          }}
          locale={ko}
          className={cn("pointer-events-auto rounded-xl border border-border p-3")}
        />
      </div>

      <div>
        <p className="mb-1 text-xs font-medium text-muted-foreground">
          시간 — {format(date, "a h:mm", { locale: ko })}
        </p>
        <ClockPicker
          hour={date.getHours()}
          minute={date.getMinutes()}
          onChange={setTime}
        />
      </div>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted-foreground">일정 이름</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예) 본부 회의"
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
        />
      </label>

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
        <button
          type="button"
          onClick={() => onSave({ ...initial, at: date.toISOString(), title: title.trim() })}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          저장
        </button>
      </DialogFooter>
    </div>
  );
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

/** 시계 형태(원형 다이얼)의 시/분 선택기 */
function ClockPicker({
  hour,
  minute,
  onChange,
}: {
  hour: number;
  minute: number;
  onChange: (hour: number, minute: number) => void;
}) {
  const isPm = hour >= 12;
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;

  const setHour12 = (h: number) => {
    const base = h % 12;
    onChange(isPm ? base + 12 : base, minute);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-2">
        {(["오전", "오후"] as const).map((label, idx) => (
          <button
            key={label}
            type="button"
            onClick={() => onChange((hour % 12) + (idx === 1 ? 12 : 0), minute)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold",
              (idx === 1) === isPm
                ? "bg-primary text-primary-foreground"
                : "border border-border text-muted-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        <Dial
          label="시"
          values={HOURS}
          selected={hour12}
          format={(v) => String(v)}
          onSelect={setHour12}
        />
        <Dial
          label="분"
          values={MINUTES}
          selected={MINUTES.includes(minute) ? minute : -1}
          format={(v) => String(v).padStart(2, "0")}
          onSelect={(v) => onChange(hour, v)}
        />
      </div>

      <input
        type="time"
        value={`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`}
        onChange={(e) => {
          const [h, m] = e.target.value.split(":").map(Number);
          if (Number.isFinite(h) && Number.isFinite(m)) onChange(h as number, m as number);
        }}
        aria-label="시간 직접 입력"
        className="rounded-xl border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-primary"
      />
    </div>
  );
}

function Dial({
  label,
  values,
  selected,
  format: fmt,
  onSelect,
}: {
  label: string;
  values: number[];
  selected: number;
  format: (v: number) => string;
  onSelect: (v: number) => void;
}) {
  const radius = 62;
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <div className="relative size-[160px] rounded-full border border-border bg-background">
        {values.map((v, i) => {
          const angle = (i / values.length) * 2 * Math.PI - Math.PI / 2;
          const x = 80 + radius * Math.cos(angle);
          const y = 80 + radius * Math.sin(angle);
          const active = v === selected;
          return (
            <button
              key={v}
              type="button"
              onClick={() => onSelect(v)}
              style={{ left: x, top: y }}
              className={cn(
                "absolute size-8 -translate-x-1/2 -translate-y-1/2 rounded-full text-xs font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-secondary",
              )}
            >
              {fmt(v)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
