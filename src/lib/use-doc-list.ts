import { useCallback, useEffect, useState } from "react";

import {
  deletePage,
  ensurePage,
  listPagesByType,
  newId,
  saveTextFields,
  type PageData,
  type PageType,
} from "@/lib/db";

/** 예전 year-scoped 데이터(meeting-2026 등)의 표시용 기본 제목 */
export function legacyTitle(id: string, kind: string): string | null {
  const match = /^(?:meeting|note|contact)-(\d{4})$/.exec(id);
  return match ? `(이전 데이터) ${match[1]}년 ${kind}` : null;
}

export function docTitle(page: PageData, kind: string, titleKey: string): string {
  const raw = page.textFields?.[titleKey]?.trim();
  if (raw) return raw;
  return legacyTitle(page.id, kind) ?? `제목 없는 ${kind}`;
}

/** 같은 타입의 문서 목록 + 생성/삭제 (list + detail 패턴 공용) */
export function useDocList(type: PageType) {
  const [docs, setDocs] = useState<PageData[]>([]);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    const list = await listPagesByType(type);
    list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    setDocs(list);
    setLoaded(true);
  }, [type]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const create = useCallback(
    async (fields: Record<string, string> = {}): Promise<string> => {
      const id = newId(type);
      await ensurePage(id, type);
      if (Object.keys(fields).length > 0) await saveTextFields(id, type, fields);
      await refresh();
      return id;
    },
    [type, refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      await deletePage(id);
      await refresh();
    },
    [refresh],
  );

  return { docs, loaded, refresh, create, remove };
}
