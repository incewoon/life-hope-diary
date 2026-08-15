import { useCallback, useEffect, useRef, useState } from "react";

import { getPage, saveTextFields, type PageType } from "@/lib/db";

export type SaveStatus = "idle" | "saving" | "saved";

/** 페이지의 textFields를 로드하고 500ms debounce로 자동 저장합니다. */
export function usePageText(pageId: string, pageType: PageType) {
  const [fields, setFields] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let alive = true;
    setLoaded(false);
    getPage(pageId)
      .then((page) => {
        if (!alive) return;
        setFields(page?.textFields ?? {});
        setLoaded(true);
      })
      .catch(() => alive && setLoaded(true));
    return () => {
      alive = false;
    };
  }, [pageId]);

  useEffect(() => {
    if (status !== "saved") return;
    const t = setTimeout(() => setStatus("idle"), 1500);
    return () => clearTimeout(t);
  }, [status]);

  const setField = useCallback(
    (key: string, value: string) => {
      setFields((prev) => {
        const next = { ...prev, [key]: value };
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => {
          setStatus("saving");
          saveTextFields(pageId, pageType, next)
            .then(() => setStatus("saved"))
            .catch(() => setStatus("idle"));
        }, 500);
        return next;
      });
    },
    [pageId, pageType],
  );

  return { fields, setField, loaded, status };
}
