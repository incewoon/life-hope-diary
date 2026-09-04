import { useCallback, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { Download, Mic, Sparkles, Square } from "lucide-react";
import { toast } from "sonner";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatElapsed(sec: number) {
  return `${pad(Math.floor(sec / 3600))}:${pad(Math.floor((sec % 3600) / 60))}:${pad(sec % 60)}`;
}

function extFor(mime: string) {
  if (mime.includes("mp4")) return "m4a";
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("wav")) return "wav";
  return "webm";
}

/** 제미나이·타 앱 호환성이 좋은 순서로 녹음 형식 선택 */
function pickMimeType(): string | undefined {
  const candidates = ["audio/mp4", "audio/mpeg", "audio/webm;codecs=opus", "audio/webm"];
  if (typeof MediaRecorder === "undefined") return undefined;
  return candidates.find((m) => MediaRecorder.isTypeSupported(m));
}

interface Props {
  /** 프롬프트에 포함할 회의 정보 */
  meta: { title: string; datetime: string; place: string; attendees: string };
}

/** 회의 녹음 — 세션 동안만 메모리에 보관 (IndexedDB 저장 안 함) */
export function MeetingRecorder({ meta }: Props) {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    if (!recording) return;
    const t = setInterval(() => setElapsed((v) => v + 1), 1000);
    return () => clearInterval(t);
  }, [recording]);

  const start = useCallback(async () => {
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      toast.error("마이크 권한이 필요합니다", {
        description: "기기 설정에서 마이크 접근을 허용해 주세요.",
      });
      return;
    }

    const preferred = pickMimeType();
    const recorder = new MediaRecorder(stream, preferred ? { mimeType: preferred } : undefined);
    chunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const mime = recorder.mimeType || "audio/webm";
      const blob = new Blob(chunksRef.current, { type: mime });
      const name = `회의록-${(meta.title || "회의").replace(/[\\/:*?"<>|]/g, "")}-${format(
        new Date(),
        "yyyyMMdd-HHmm",
      )}.${extFor(mime)}`;
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      const next = URL.createObjectURL(blob);
      urlRef.current = next;
      setFile(new File([blob], name, { type: mime }));
      setUrl(next);
      stream.getTracks().forEach((t) => t.stop());
    };

    recorderRef.current = recorder;
    setElapsed(0);
    setFile(null);
    setUrl(null);
    recorder.start();
    setRecording(true);
  }, [meta.title]);

  const stop = useCallback(() => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
  }, []);

  const prompt = [
    "첨부한 회의 녹음 파일을 듣고 한국어로 회의록을 정리해 주세요.",
    "1) 회의 요약  2) 주요 논의 내용  3) 결정 사항  4) 후속 조치(담당자/기한)",
    meta.title ? `회의명: ${meta.title}` : "",
    meta.datetime ? `일시: ${meta.datetime}` : "",
    meta.place ? `장소: ${meta.place}` : "",
    meta.attendees ? `참석자: ${meta.attendees}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const canShare =
    typeof navigator !== "undefined" &&
    typeof navigator.canShare === "function" &&
    !!file &&
    navigator.canShare({ files: [file] });

  const share = async () => {
    if (!file) return;
    try {
      await navigator.clipboard.writeText(prompt);
    } catch {
      /* 클립보드 실패는 무시 */
    }
    try {
      await navigator.share({ files: [file], title: meta.title || "회의 녹음", text: prompt });
      toast.success("공유 시트에서 제미나이를 선택하세요", {
        description: "요약 요청 문구는 클립보드에 복사했습니다.",
      });
    } catch {
      /* 사용자가 취소한 경우 */
    }
  };

  const download = () => {
    if (!file || !url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    void navigator.clipboard?.writeText(prompt).catch(() => undefined);
    toast.success("녹음 파일을 저장했습니다", {
      description: "제미나이 앱에서 파일을 첨부하세요. 요약 문구는 복사됨.",
    });
  };

  return (
    <section className="mb-4 rounded-xl border border-border bg-card p-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => (recording ? stop() : void start())}
          className={
            recording
              ? "flex size-11 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
              : "flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground"
          }
          aria-label={recording ? "녹음 정지" : "녹음 시작"}
        >
          {recording ? <Square className="size-5" /> : <Mic className="size-5" />}
        </button>

        <div className="flex items-center gap-2">
          {recording ? (
            <span className="size-2 animate-pulse rounded-full bg-destructive" aria-hidden />
          ) : null}
          <span className="font-mono text-lg tabular-nums text-foreground">
            {formatElapsed(elapsed)}
          </span>
        </div>

        {url ? (
          <audio src={url} controls className="h-10 min-w-0 flex-1" />
        ) : (
          <span className="text-sm text-muted-foreground">
            {recording ? "녹음 중…" : "녹음 버튼을 눌러 회의를 녹음하세요."}
          </span>
        )}

        {file ? (
          canShare ? (
            <button
              type="button"
              onClick={() => void share()}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
            >
              <Sparkles className="size-4" />
              제미나이로 요약
            </button>
          ) : (
            <button
              type="button"
              onClick={download}
              className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm text-foreground"
            >
              <Download className="size-4" />
              녹음 파일 저장
            </button>
          )
        ) : null}
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        {file && !canShare
          ? "이 기기에서는 파일 공유가 지원되지 않습니다. 파일을 저장한 뒤 제미나이 앱에서 첨부하세요. "
          : ""}
        녹음은 이 화면을 벗어나거나 앱을 다시 열면 사라집니다. 필요하면 먼저 공유·저장하세요.
      </p>
    </section>
  );
}
