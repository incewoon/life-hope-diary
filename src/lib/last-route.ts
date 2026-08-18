import { useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { getMeta, setMeta, META_KEYS } from "@/lib/db";

/** 세션당 1회만 복원 (표지에서 직접 이동한 뒤 다시 되돌아가지 않도록) */
let restoreAttempted = false;

/** 현재 경로를 기기에 기록합니다. 표지(/)는 기록하지 않습니다. */
export function useTrackLastRoute(): void {
  const location = useRouterState({ select: (s) => s.location.href });

  useEffect(() => {
    if (!location || location === "/") return;
    void setMeta(META_KEYS.lastRoute, location).catch(() => undefined);
  }, [location]);
}

/** 표지 진입 시 마지막으로 보던 페이지로 1회 복원합니다. */
export function useRestoreLastRoute(): void {
  const navigate = useNavigate();

  useEffect(() => {
    if (restoreAttempted) return;
    restoreAttempted = true;

    void getMeta(META_KEYS.lastRoute)
      .then((saved) => {
        if (!saved || !saved.startsWith("/") || saved === "/") return;
        void navigate({ to: saved, replace: true });
      })
      .catch(() => undefined);
  }, [navigate]);
}
