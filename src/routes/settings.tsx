import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { PageShell } from "@/components/PageShell";
import { applyBackup, exportBackup, readBackupFromDevice } from "@/lib/backup/backup";
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

function SettingsPage() {
  const { year } = useSelectedYear();
  const [busy, setBusy] = useState(false);

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
      toast.success(`추가 ${result.added}건 · 갱신 ${result.updated}건 복원되었습니다.`);
    } catch {
      toast.error("가져오기에 실패했습니다. 파일 형식을 확인하세요.");
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
    </PageShell>
  );
}
