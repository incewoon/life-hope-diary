import { useCallback, useEffect, useState } from "react";

import { getMeta, setMeta, META_KEYS } from "@/lib/db";

export function currentYear(): number {
  return new Date().getFullYear();
}

export function yearOptions(base = currentYear()): number[] {
  return [base - 2, base - 1, base, base + 1, base + 2];
}

/** 선택 연도(기본값: 올해). IndexedDB meta에 저장됩니다. */
export function useSelectedYear() {
  const [year, setYearState] = useState<number>(currentYear());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    getMeta(META_KEYS.selectedYear)
      .then((value) => {
        if (!alive) return;
        const parsed = Number(value);
        if (parsed >= 1900 && parsed <= 3000) setYearState(parsed);
        setLoaded(true);
      })
      .catch(() => alive && setLoaded(true));
    return () => {
      alive = false;
    };
  }, []);

  const setYear = useCallback((next: number) => {
    setYearState(next);
    void setMeta(META_KEYS.selectedYear, String(next));
  }, []);

  return { year, setYear, loaded };
}

export const pad2 = (n: number) => String(n).padStart(2, "0");

export const dailyId = (y: number, m: number, d: number) =>
  `daily-${y}-${pad2(m)}-${pad2(d)}`;
export const monthlyId = (y: number, m: number) => `monthly-${y}-${pad2(m)}`;
