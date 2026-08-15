import { Link } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";

import { backupIsStale, getLastBackupAt } from "@/lib/backup/backup";

/** 마지막 백업 후 7일 이상 지나면 상단 리마인더 배너 노출 */
export function BackupReminder() {
  const [stale, setStale] = useState(false);

  useEffect(() => {
    let alive = true;
    getLastBackupAt()
      .then((last) => {
        if (alive) setStale(backupIsStale(last));
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  if (!stale) return null;

  return (
    <div className="mb-3 flex items-center gap-2 rounded-xl border border-accent/40 bg-accent/10 px-3 py-2 text-sm text-foreground">
      <AlertTriangle className="size-4 shrink-0 text-accent" />
      <span className="flex-1">
        최근 7일 내 백업 기록이 없습니다. 기기 초기화에 대비해 백업을 권장합니다.
      </span>
      <Link
        to="/settings"
        className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
      >
        백업하기
      </Link>
    </div>
  );
}
