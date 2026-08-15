import { format } from "date-fns";

import { getDb, getMeta, setMeta, META_KEYS, type PageData } from "@/lib/db";
import { saveBackupFile, pickBackupFile } from "./file-io";

export interface BackupFile {
  app: "lh-work-plan";
  version: 1;
  exportedAt: string;
  year: number | "all";
  pages: PageData[];
}

export function buildFilename(year: number | "all", date = new Date()): string {
  const day = format(date, "yyyy-MM-dd");
  return year === "all"
    ? `LH업무수첩_백업_${day}.json`
    : `LH업무수첩_백업_${year}_${day}.json`;
}

/** 특정 연도에 속하는 페이지인지 판정 (연도 무관 페이지는 항상 포함) */
export function belongsToYear(page: PageData, year: number): boolean {
  const match = /(?:^|-)(\d{4})-\d{2}/.exec(page.id);
  if (!match) return true;
  return Number(match[1]) === year;
}

export async function collectPages(year: number | "all"): Promise<PageData[]> {
  const all = await getDb().pages.toArray();
  return year === "all" ? all : all.filter((p) => belongsToYear(p, year));
}

export async function exportBackup(year: number | "all"): Promise<number> {
  const pages = await collectPages(year);
  const payload: BackupFile = {
    app: "lh-work-plan",
    version: 1,
    exportedAt: new Date().toISOString(),
    year,
    pages,
  };
  await saveBackupFile(buildFilename(year), JSON.stringify(payload, null, 2));
  await setMeta(META_KEYS.lastBackupAt, new Date().toISOString());
  return pages.length;
}

export function parseBackup(raw: string): BackupFile {
  const parsed = JSON.parse(raw) as Partial<BackupFile>;
  if (parsed.app !== "lh-work-plan" || !Array.isArray(parsed.pages)) {
    throw new Error("LH 업무수첩 백업 파일이 아닙니다.");
  }
  return parsed as BackupFile;
}

export interface MergePlan {
  incomingNewer: PageData[];
  localNewer: PageData[];
  brandNew: PageData[];
  ambiguous: { incoming: PageData; local: PageData }[];
}

/** 순수 병합 판정 — 파일 I/O와 무관 */
export function planMerge(incoming: PageData[], locals: PageData[]): MergePlan {
  const localMap = new Map(locals.map((p) => [p.id, p]));
  const plan: MergePlan = {
    incomingNewer: [],
    localNewer: [],
    brandNew: [],
    ambiguous: [],
  };
  for (const page of incoming) {
    const local = localMap.get(page.id);
    if (!local) {
      plan.brandNew.push(page);
      continue;
    }
    const a = Date.parse(page.updatedAt);
    const b = Date.parse(local.updatedAt);
    if (Number.isNaN(a) || Number.isNaN(b)) {
      plan.ambiguous.push({ incoming: page, local });
    } else if (a > b) {
      plan.incomingNewer.push(page);
    } else if (a < b) {
      plan.localNewer.push(local);
    } else if (JSON.stringify(page) !== JSON.stringify(local)) {
      plan.ambiguous.push({ incoming: page, local });
    }
  }
  return plan;
}

export interface ImportResult {
  plan: MergePlan;
  applied: number;
}

export async function readBackupFromDevice(): Promise<BackupFile | null> {
  const raw = await pickBackupFile();
  if (!raw) return null;
  return parseBackup(raw);
}

/** 자동 병합(더 최신 데이터 채택). 애매한 항목은 적용하지 않고 반환합니다. */
export async function applyBackup(file: BackupFile): Promise<ImportResult> {
  const db = getDb();
  const locals = await db.pages.toArray();
  const plan = planMerge(file.pages, locals);
  const toWrite = [...plan.brandNew, ...plan.incomingNewer];
  if (toWrite.length > 0) await db.pages.bulkPut(toWrite);
  return { plan, applied: toWrite.length };
}

export async function resolveAmbiguous(pages: PageData[]): Promise<void> {
  if (pages.length === 0) return;
  await getDb().pages.bulkPut(pages);
}

export async function getLastBackupAt(): Promise<Date | null> {
  const iso = await getMeta(META_KEYS.lastBackupAt);
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function backupIsStale(last: Date | null): boolean {
  if (!last) return true;
  return Date.now() - last.getTime() > 7 * 24 * 60 * 60 * 1000;
}
