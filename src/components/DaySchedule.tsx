import { useMemo, useState } from "react";
import { addHours, format, isSameDay } from "date-fns";

import { CalendarPlus, Trash2 } from "lucide-react";

import { DateTimeRow } from "@/components/DateTimePicker";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  parseSchedule,
  removeScheduleAcrossDays,
  saveScheduleAcrossDays,
  scheduleEnd,
  serializeSchedule,
  type ScheduleItem,
} from "@/lib/schedule";

export { parseSchedule, scheduleEnd, type ScheduleItem };

const startOfDayMs = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** 현재 시각을 30분 단위로 올림 */
function roundUpHalfHour(base: Date): Date {
  const d = new Date(base);
  const now = new Date();
  d.setHours(now.getHours(), now.getMinutes() >= 30 ? 60 : 30, 0, 0);
  return d;
}

function chipLabel(item: ScheduleItem): string {
  const start = new Date(item.at);
  const end = scheduleEnd(item);
  if (isSameDay(start, end)) {
    return `${format(start, "HH:mm")}–${format(end, "HH:mm")}`;
  }
  return `${format(start, "M/d HH:mm")} → ${format(end, "M/d HH:mm")}`;
}

interface Props {
  /** 현재 보고 있는 날짜 (새 일정 기본값) */
  baseDate: Date;
  /** 현재 날짜 페이지 id (다중일 저장 시 중복 쓰기 방지) */
  pageId: string;
  value: string | undefined;
  onChange: (serialized: string) => void;
}

export function DaySchedule({ baseDate, pageId, value, onChange }: Props) {
  const items = useMemo(() => parseSchedule(value), [value]);
  const [editing, setEditing] = useState<ScheduleItem | null>(null);
  const [open, setOpen] = useState(false);

  const commit = (next: ScheduleItem[]) => onChange(serializeSchedule(next));

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
    const prev = items.find((it) => it.id === item.id);
    const rest = items.filter((it) => it.id !== item.id);
    // 이 날짜에 여전히 포함되는 경우에만 현재 화면 목록에 유지
    const start = new Date(item.at);
    const stillHere =
      startOfDayMs(start) <= startOfDayMs(baseDate) &&
      startOfDayMs(scheduleEnd(item)) >= startOfDayMs(baseDate);
    commit(stillHere ? [...rest, item] : rest);
    void saveScheduleAcrossDays(item, prev, pageId);
    setOpen(false);
  };

  const remove = (item: ScheduleItem) => {
    commit(items.filter((it) => it.id !== item.id));
    void removeScheduleAcrossDays(item, pageId);
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
            <span className="font-semibold text-primary">{chipLabel(item)}</span>

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
              onDelete={() => remove(editing)}
              onCancel={() => setOpen(false)}
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
