/**
 * 백업 파일 저장/읽기 어댑터.
 * ------------------------------------------------------------------
 * 지금은 브라우저(Blob 다운로드 / file input) 구현만 사용합니다.
 * Capacitor(APK)로 감쌀 때는 파일 시스템 접근 방식이 달라지므로
 * 이 파일의 두 함수 구현만 플랫폼 분기로 교체하면 됩니다.
 * 병합·직렬화 로직은 backup.ts에 순수 함수로 분리되어 있습니다.
 */

export function isNativePlatform(): boolean {
  if (typeof window === "undefined") return false;
  // Capacitor 주입 시 window.Capacitor 존재
  return Boolean((window as unknown as { Capacitor?: unknown }).Capacitor);
}

export async function saveBackupFile(filename: string, contents: string): Promise<void> {
  // TODO(capacitor): isNativePlatform() 인 경우 @capacitor/filesystem 로 교체
  const blob = new Blob([contents], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function pickBackupFile(): Promise<string | null> {
  // TODO(capacitor): isNativePlatform() 인 경우 네이티브 파일 선택기로 교체
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => resolve(null);
      reader.readAsText(file);
    };
    input.click();
  });
}
