import { Plus, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";

export interface DocListItem {
  id: string;
  title: string;
  sub?: string | undefined;
}

interface Props {
  items: DocListItem[];
  selectedId?: string | undefined;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  addLabel: string;
  emptyLabel: string;
  className?: string | undefined;
}

/** 회의록 / 노트 / 연락처 공용 목록 패널 */
export function DocList({
  items,
  selectedId,
  onSelect,
  onCreate,
  onDelete,
  addLabel,
  emptyLabel,
  className,
}: Props) {
  return (
    <aside className={cn("flex flex-col gap-2", className)}>
      <button
        type="button"
        onClick={onCreate}
        className="flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
      >
        <Plus className="size-4" />
        {addLabel}
      </button>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
          {emptyLabel}
        </p>
      ) : (
        <ul className="flex max-h-[70vh] flex-col gap-1 overflow-y-auto">
          {items.map((item) => (
            <li key={item.id}>
              <div
                className={cn(
                  "group flex items-center gap-1 rounded-xl border px-3 py-2",
                  item.id === selectedId
                    ? "border-primary bg-secondary"
                    : "border-border bg-card",
                )}
              >
                <button
                  type="button"
                  onClick={() => onSelect(item.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <span className="block truncate text-sm font-medium text-foreground">
                    {item.title}
                  </span>
                  {item.sub ? (
                    <span className="block truncate text-xs text-muted-foreground">
                      {item.sub}
                    </span>
                  ) : null}
                </button>
                <button
                  type="button"
                  aria-label="삭제"
                  onClick={() => {
                    if (confirm("이 항목을 삭제할까요? 되돌릴 수 없습니다.")) onDelete(item.id);
                  }}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
