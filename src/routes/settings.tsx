import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { PageShell } from "@/components/PageShell";
import {
  applyBackup,
  exportBackup,
  readBackupFromDevice,
  resolveAmbiguous,
  type MergePlan,
} from "@/lib/backup/backup";
import type { PageData } from "@/lib/db";
import { useSelectedYear } from "@/lib/year";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "설정 · 백업 — LH 업무수첩" },
      { name: "description", content: "업무수첩 데이터를 JSON으로 내보내고 다시 가져옵니다." },
      { property: "og:title", content: "설정 · 백업 — LH 업무수첩" },
      { property: "og:description", content: "기기 내 데이터 백업과 복원." },
    ],
  }),
  component: SettingsPage,
});

function formatTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString("ko-KR");
}

function SettingsPage() {
  const { year } = useSelectedYear();
  const [busy, setBusy] = useState(false);
  const [ambiguous, setAmbiguous] = useState<MergePlan["ambiguous"]>([]);

  const handleExport = async (scope: number | "all") => {
    setBusy(true);
    try {
      const count = await exportBackup(scope);
      toast.success(`${count}개 페이지를 백업했습니다.`);
    } catch {
      toast.error("백업에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const handleImport = async () => {
    setBusy(true);
    try {
      const file = await readBackupFromDevice();
      if (!file) return;
      const result = await applyBackup(file);
      toast.success(`${result.applied}개 페이지를 복원했습니다.`);
      if (result.plan.ambiguous.length > 0) setAmbiguous(result.plan.ambiguous);
    } catch {
      toast.error("가져오기에 실패했습니다. 파일 형식을 확인하세요.");
    } finally {
      setBusy(false);
    }
  };

  const handleOverwrite = async () => {
    const pages: PageData[] = ambiguous.map((a) => a.incoming);
    setBusy(true);
    try {
      await resolveAmbiguous(pages);
      toast.success(`${pages.length}개 페이지를 백업 파일 내용으로 덮어썼습니다.`);
      setAmbiguous([]);
    } catch {
      toast.error("덮어쓰기에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  };


  return (
    <PageShell title="설정 · 백업" subtitle="모든 데이터는 이 기기에만 저장됩니다">
      <section className="mb-4 rounded-xl border border-border bg-card p-4">
        <h2 className="mb-1 font-semibold text-foreground">백업 내보내기</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          JSON 파일로 저장합니다. 기기 교체·초기화 전에 꼭 내보내세요.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => handleExport(year)}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {year}년만 내보내기
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => handleExport("all")}
            className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground disabled:opacity-50"
          >
            전체 내보내기
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-1 font-semibold text-foreground">백업 가져오기</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          같은 페이지는 더 최근에 수정된 내용으로 병합됩니다.
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={handleImport}
          className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground disabled:opacity-50"
        >
          파일 선택해 복원
        </button>
      </section>

      {ambiguous.length > 0 ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="병합 확인 필요"
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4"
        >
          <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-1 text-base font-semibold text-foreground">
              어느 쪽을 남길지 확인이 필요합니다
            </h2>
            <p className="mb-3 text-sm text-muted-foreground">
              아래 {ambiguous.length}개 페이지는 자동으로 판단할 수 없어 그대로 두었습니다.
            </p>
            <ul className="mb-4 flex flex-col gap-2">
              {ambiguous.map(({ incoming, local }) => (
                <li key={incoming.id} className="rounded-xl border border-border p-3 text-xs">
                  <p className="font-medium text-foreground">{incoming.id}</p>
                  <p className="mt-1 text-muted-foreground">
                    기기: {formatTime(local.updatedAt)}
                  </p>
                  <p className="text-muted-foreground">백업: {formatTime(incoming.updatedAt)}</p>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => setAmbiguous([])}
                className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground disabled:opacity-50"
              >
                기존 데이터 유지
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleOverwrite()}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                백업 파일로 덮어쓰기
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}
