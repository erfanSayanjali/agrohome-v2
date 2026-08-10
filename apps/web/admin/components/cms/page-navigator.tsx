"use client";

import { ChevronDown, ChevronLeft, Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { SortableList } from "@/components/ui/sortable-list";
import {
  blockTypeLabel,
  expandNavigatorNodes,
  type Selection,
} from "@/lib/cms-blocks";
import { cn } from "@/lib/utils";

export type NavBlock = {
  id: string;
  localId: string;
  type: string;
  name?: string | null;
  isVisible: boolean;
  payload: Record<string, unknown>;
};

type PageNavigatorProps = {
  blocks: NavBlock[];
  selection: Selection | null;
  onSelect: (sel: Selection) => void;
  onReorder: (blocks: NavBlock[]) => void;
  onToggleVisible: (blockId: string) => void;
};

export function PageNavigator({
  blocks,
  selection,
  onSelect,
  onReorder,
  onToggleVisible,
}: PageNavigatorProps) {
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (selection?.blockId) {
      setOpenIds((prev) => ({ ...prev, [selection.blockId]: true }));
    }
  }, [selection?.blockId]);

  function toggleOpen(id: string) {
    setOpenIds((prev) => ({ ...prev, [id]: !(prev[id] ?? false) }));
  }

  return (
    <div className="flex h-full flex-col" dir="rtl">
      <div className="border-b border-[var(--admin-border)] px-3 py-2.5">
        <p className="text-sm font-semibold">ساختار صفحه</p>
        <p className="text-xs text-[var(--admin-muted)]">سکشن‌ها و زیر‌المان‌ها</p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {blocks.length === 0 ? (
          <p className="p-3 text-xs text-[var(--admin-muted)]">هنوز بخشی نیست.</p>
        ) : (
          <SortableList
            items={blocks}
            onReorder={onReorder}
            renderItem={(block, _index, handle) => {
              const open = openIds[block.id] ?? false;
              const nodes = expandNavigatorNodes(block.type, block.payload || {});
              const sectionActive = selection?.blockId === block.id && !selection.path;
              return (
                <div
                  className={cn(
                    "rounded-[var(--admin-radius-sm)] border border-[var(--admin-border)] bg-[var(--admin-surface)]/60",
                    selection?.blockId === block.id && "border-[var(--admin-accent)]/50"
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center gap-1 px-1.5 py-1.5",
                      sectionActive && "bg-[var(--admin-accent)]/10"
                    )}
                  >
                    {handle}
                    <button
                      type="button"
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[var(--admin-muted)] hover:bg-white/5"
                      onClick={() => toggleOpen(block.id)}
                      aria-label="باز/بسته"
                    >
                      {open ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronLeft className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      className="min-w-0 flex-1 truncate text-start text-xs font-medium"
                      onClick={() => onSelect({ blockId: block.id, path: null })}
                    >
                      {block.name || blockTypeLabel(block.type)}
                    </button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => onToggleVisible(block.id)}
                      aria-label="نمایش"
                    >
                      {block.isVisible ? (
                        <Eye className="h-3.5 w-3.5" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5 text-[var(--admin-muted)]" />
                      )}
                    </Button>
                  </div>
                  {open ? (
                    <div className="border-t border-[var(--admin-border)] py-1">
                      {nodes.map((node) => {
                        const active =
                          selection?.blockId === block.id && selection.path === node.path;
                        const nested = /\.\d+$/.test(node.path);
                        return (
                          <button
                            key={node.path}
                            type="button"
                            className={cn(
                              "flex w-full items-center truncate px-3 py-1.5 text-start text-[11px] text-[var(--admin-muted)] hover:bg-white/5 hover:text-[var(--admin-text)]",
                              nested && "ps-8",
                              active && "bg-[var(--admin-accent)]/15 text-[var(--admin-text)]"
                            )}
                            onClick={() => onSelect({ blockId: block.id, path: node.path })}
                          >
                            {node.label}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            }}
          />
        )}
      </div>
    </div>
  );
}
