import { useEffect } from "react";
import { toast } from "sonner";

import { getLastBackupAt } from "@/lib/backup/backup";
import { getMeta, setMeta, META_KEYS } from "@/lib/db";

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

/**
 * 앱 시작 시 1회 실행.
 * - 최초 설치 후 첫 실행: 로컬 저장 안내 토스트 1회
 * - 이후: 마지막 백업 후 30일 경과 시에만 백업 권장 토스트(30일 간격)
 */
export function useAppNotices(): void {
  useEffect(() => {
    let alive = true;

    void (async () => {
      try {
        const shown = await getMeta(META_KEYS.onboardingNoticeShown);
        if (!alive) return;

        if (!shown) {
          await setMeta(META_KEYS.onboardingNoticeShown, new Date().toISOString());
          await setMeta(META_KEYS.lastBackupNoticeAt, new Date().toISOString());
          toast("모든 데이터는 이 기기에만 저장됩니다", {
            description: "기기 초기화에 대비해 설정에서 주기적으로 백업하세요.",
            duration: 8000,
          });
          return;
        }

        const noticedAt = await getMeta(META_KEYS.lastBackupNoticeAt);
        const noticedMs = noticedAt ? new Date(noticedAt).getTime() : 0;
        if (Number.isFinite(noticedMs) && Date.now() - noticedMs < THIRTY_DAYS) return;

        const last = await getLastBackupAt();
        if (last && Date.now() - last.getTime() < THIRTY_DAYS) return;
        if (!alive) return;

        await setMeta(META_KEYS.lastBackupNoticeAt, new Date().toISOString());
        toast("백업한 지 오래되었습니다", {
          description: "기기 초기화에 대비해 백업을 권장합니다.",
          duration: 10000,
          action: {
            label: "백업하기",
            onClick: () => {
              window.location.href = "/settings";
            },
          },
        });
      } catch {
        /* 저장소 접근 실패 시 조용히 무시 */
      }
    })();

    return () => {
      alive = false;
    };
  }, []);
}
