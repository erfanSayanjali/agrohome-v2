"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type SortableListProps<T extends { localId: string }> = {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (item: T, index: number, handle: React.ReactNode) => React.ReactNode;
};

export function SortableList<T extends { localId: string }>({
  items,
  onReorder,
  renderItem,
}: SortableListProps<T>) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const activeIndex = activeId
    ? items.findIndex((item) => item.localId === activeId)
    : -1;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((item) => item.localId === active.id);
    const newIndex = items.findIndex((item) => item.localId === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onReorder(arrayMove(items, oldIndex, newIndex));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <SortableContext
        items={items.map((item) => item.localId)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {items.map((item, index) => (
            <SortableRow key={item.localId} id={item.localId}>
              {(handle) => renderItem(item, index, handle)}
            </SortableRow>
          ))}
        </div>
      </SortableContext>

      <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }}>
        {activeIndex >= 0 ? (
          <div className="scale-[1.02] rounded-2xl border border-[var(--admin-border-strong)] bg-[var(--admin-surface)] p-4 opacity-95 shadow-[0_20px_50px_rgba(0,0,0,0.35)] ring-1 ring-[var(--admin-accent)]/30">
            <div className="flex items-center gap-2 text-sm text-[var(--admin-muted)]">
              <GripVertical className="h-4 w-4 text-[var(--admin-accent)]" />
              در حال جابجایی…
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function SortableRow({
  id,
  children,
}: {
  id: string;
  children: (handle: React.ReactNode) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handle = (
    <button
      type="button"
      className={cn(
        "inline-flex h-9 w-9 shrink-0 cursor-grab items-center justify-center rounded-lg border border-[var(--admin-border)] bg-white/[0.03] text-[var(--admin-muted)] transition",
        "hover:border-[var(--admin-border-strong)] hover:bg-[var(--admin-accent)]/10 hover:text-[var(--admin-accent)]",
        "active:cursor-grabbing"
      )}
      aria-label="جابجایی با درگ"
      {...attributes}
      {...listeners}
    >
      <GripVertical className="h-4 w-4" />
    </button>
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "touch-none",
        isDragging && "z-10 opacity-40"
      )}
    >
      {children(handle)}
    </div>
  );
}
