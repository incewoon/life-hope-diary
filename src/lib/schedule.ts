import { addHours, eachDayOfInterval, startOfDay } from "date-fns";

import { getPage, saveTextFields, listPagesByType } from "@/lib/db";
import { dailyId, pad2 } from "@/lib/year";

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

export function serializeSchedule(items: ScheduleItem[]): string {
  return JSON.stringify([...items].sort((a, b) => a.at.localeCompare(b.at)));
}

const dayKey = (d: Date) => dailyId(d.getFullYear(), d.getMonth() + 1, d.getDate());

/** 일정이 걸쳐 있는 모든 날짜의 페이지 id 목록 */
export function scheduleDayIds(item: ScheduleItem): string[] {
  const start = startOfDay(new Date(item.at));
  const endDate = scheduleEnd(item);
  const end = startOfDay(endDate.getTime() < start.getTime() ? start : endDate);
  return eachDayOfInterval({ start, end }).map(dayKey);
}

async function mutateDay(
  pageId: string,
  fn: (items: ScheduleItem[]) => ScheduleItem[],
): Promise<void> {
  const page = await getPage(pageId);
  const fields = page?.textFields ?? {};
  const next = fn(parseSchedule(fields["schedule"]));
  await saveTextFields(pageId, "daily", { ...fields, schedule: serializeSchedule(next) });
}

/** 일정을 걸쳐 있는 모든 날짜에 저장하고, 더 이상 포함되지 않는 날짜에서는 제거 */
export async function saveScheduleAcrossDays(
  item: ScheduleItem,
  prev?: ScheduleItem | undefined,
  skipPageId?: string,
): Promise<void> {
  const targets = new Set(scheduleDayIds(item));
  const previous = prev ? scheduleDayIds(prev) : [];
  const stale = previous.filter((id) => !targets.has(id));

  await Promise.all([
    ...[...targets]
      .filter((id) => id !== skipPageId)
      .map((id) =>
        mutateDay(id, (items) => {
          const rest = items.filter((it) => it.id !== item.id);
          return [...rest, item];
        }),
      ),
    ...stale
      .filter((id) => id !== skipPageId)
      .map((id) => mutateDay(id, (items) => items.filter((it) => it.id !== item.id))),
  ]);
}

/** 일정을 걸쳐 있는 모든 날짜에서 삭제 */
export async function removeScheduleAcrossDays(
  item: ScheduleItem,
  skipPageId?: string,
): Promise<void> {
  await Promise.all(
    scheduleDayIds(item)
      .filter((id) => id !== skipPageId)
      .map((id) => mutateDay(id, (items) => items.filter((it) => it.id !== item.id))),
  );
}

/** 해당 월에서 일정이 하나라도 있는 날짜(1~31) 집합 */
export async function listScheduleDays(year: number, month: number): Promise<Set<number>> {
  const prefix = `daily-${year}-${pad2(month)}-`;
  const pages = await listPagesByType("daily");
  const days = new Set<number>();
  for (const page of pages) {
    if (!page.id.startsWith(prefix)) continue;
    if (parseSchedule(page.textFields?.["schedule"]).length === 0) continue;
    const d = Number(page.id.slice(prefix.length));
    if (Number.isFinite(d)) days.add(d);
  }
  return days;
}
