import Dexie, { type Table } from "dexie";

export interface StrokePoint {
  x: number;
  y: number;
  pressure: number;
}

export interface Stroke {
  points: StrokePoint[];
  color: string;
  width: number;
}

export type PageType = "daily" | "monthly" | "meeting" | "note" | "contact" | "static";

export interface PageData {
  id: string; // daily-2025-08-15 / monthly-2025-08 / meeting-{uuid} ...
  type: PageType;
  textFields?: Record<string, string>;
  strokes: Stroke[];
  updatedAt: string; // ISO timestamp
}

export interface MetaRow {
  key: string;
  value: string;
}

class DiaryDB extends Dexie {
  pages!: Table<PageData, string>;
  meta!: Table<MetaRow, string>;

  constructor() {
    super("lh-work-plan");
    // id: 기본키, type/updatedAt: 유형별·기간별 조회 및 백업 성능용 인덱스
    this.version(1).stores({
      pages: "id, type, updatedAt",
      meta: "key",
    });
  }
}

let dbInstance: DiaryDB | null = null;

/** IndexedDB는 브라우저에서만 사용 가능하므로 지연 초기화합니다. */
export function getDb(): DiaryDB {
  if (!dbInstance) dbInstance = new DiaryDB();
  return dbInstance;
}

export const nowIso = () => new Date().toISOString();

export function newId(prefix: PageType): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now().toString(36)}${rand}`;
}

export async function getPage(id: string): Promise<PageData | undefined> {
  return getDb().pages.get(id);
}

export async function ensurePage(id: string, type: PageType): Promise<PageData> {
  const db = getDb();
  const existing = await db.pages.get(id);
  if (existing) return existing;
  const created: PageData = { id, type, textFields: {}, strokes: [], updatedAt: nowIso() };
  await db.pages.put(created);
  return created;
}

/** 새 stroke만 append (전체 배열 덮어쓰기 방지) */
export async function appendStrokes(
  id: string,
  type: PageType,
  strokes: Stroke[],
): Promise<void> {
  if (strokes.length === 0) return;
  const db = getDb();
  await db.transaction("rw", db.pages, async () => {
    const page = await db.pages.get(id);
    if (!page) {
      await db.pages.put({ id, type, textFields: {}, strokes, updatedAt: nowIso() });
      return;
    }
    page.strokes.push(...strokes);
    page.updatedAt = nowIso();
    await db.pages.put(page);
  });
}

/** undo / 지우개 / 전체 지우기 등 파괴적 동작에서만 전체 재기록 */
export async function replaceStrokes(
  id: string,
  type: PageType,
  strokes: Stroke[],
): Promise<void> {
  const db = getDb();
  await db.transaction("rw", db.pages, async () => {
    const page = (await db.pages.get(id)) ?? {
      id,
      type,
      textFields: {},
      strokes: [],
      updatedAt: nowIso(),
    };
    page.strokes = strokes;
    page.updatedAt = nowIso();
    await db.pages.put(page);
  });
}

export async function saveTextFields(
  id: string,
  type: PageType,
  textFields: Record<string, string>,
): Promise<void> {
  const db = getDb();
  await db.transaction("rw", db.pages, async () => {
    const page = (await db.pages.get(id)) ?? {
      id,
      type,
      textFields: {},
      strokes: [],
      updatedAt: nowIso(),
    };
    page.textFields = { ...page.textFields, ...textFields };
    page.updatedAt = nowIso();
    await db.pages.put(page);
  });
}

export async function deletePage(id: string): Promise<void> {
  await getDb().pages.delete(id);
}

export async function listPagesByType(type: PageType): Promise<PageData[]> {
  return getDb().pages.where("type").equals(type).toArray();
}

export async function getMeta(key: string): Promise<string | undefined> {
  const row = await getDb().meta.get(key);
  return row?.value;
}

export async function setMeta(key: string, value: string): Promise<void> {
  await getDb().meta.put({ key, value });
}

export const META_KEYS = {
  selectedYear: "selectedYear",
  lastBackupAt: "lastBackupAt",
  lastBackupNoticeAt: "lastBackupNoticeAt",
  onboardingNoticeShown: "onboardingNoticeShown",
  lastRoute: "lastRoute",
} as const;
