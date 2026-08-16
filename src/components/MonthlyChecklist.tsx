import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export function parseChecklist(raw: string | undefined): ChecklistItem[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((entry): ChecklistItem[] => {
      if (typeof entry !== "object" || entry === null) return [];
      const item = entry as Partial<ChecklistItem>;
      if (typeof item.id !== "string" || typeof item.text !== "string") return [];
      return [{ id: item.id, text: item.text, checked: item.checked === true }];
    });
  } catch {
    return [];
  }
}

interface Props {
  value: string | undefined;
  onChange: (serialized: string) => void;
}

export function MonthlyChecklist({ value, onChange }: Props) {
  const items = useMemo(() => parseChecklist(value), [value]);
  const [draft, setDraft] = useState("");

  const commit = (next: ChecklistItem[]) => onChange(JSON.stringify(next));

  const add = () => {
    const text = draft.trim();
    if (!text) return;
    commit([
      ...items,
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, text, checked: false },
    ]);
    setDraft("");
  };

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h2 className="mb-3 text-sm font-bold tracking-widest text-primary uppercase">Check List</h2>

      <div className="mb-3 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="이달의 할 일"
          className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
        />
        <button
          type="button"
          onClick={add}
          aria-label="항목 추가"
          className="rounded-xl bg-primary px-3 py-2 text-primary-foreground"
        >
          <Plus className="size-4" />
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">항목을 추가해 이달의 체크리스트를 만드세요.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-2 rounded-lg px-1 py-1.5">
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() =>
                  commit(
                    items.map((it) =>
                      it.id === item.id ? { ...it, checked: !it.checked } : it,
                    ),
                  )
                }
                className="size-4 accent-[var(--color-primary)]"
              />
              <span
                className={
                  item.checked
                    ? "min-w-0 flex-1 text-sm text-muted-foreground line-through"
                    : "min-w-0 flex-1 text-sm text-foreground"
                }
              >
                {item.text}
              </span>
              <button
                type="button"
                aria-label="항목 삭제"
                onClick={() => commit(items.filter((it) => it.id !== item.id))}
                className="rounded-lg p-1 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
