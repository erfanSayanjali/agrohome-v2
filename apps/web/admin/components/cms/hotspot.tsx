"use client";

import { cn } from "@/lib/utils";

type HotspotProps = {
  path: string;
  selected: boolean;
  onSelect: (path: string, e: React.MouseEvent) => void;
  className?: string;
  children: React.ReactNode;
  label?: string;
  /** داخل <p>/<h*> باید span باشد تا HTML نامعتبر نشود */
  as?: "div" | "span";
};

/** ناحیه کلیک‌پذیر روی بوم برای زیر‌سکشن */
export function Hotspot({
  path,
  selected,
  onSelect,
  className,
  children,
  label,
  as: Tag = "div",
}: HotspotProps) {
  return (
    <Tag
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(path, e);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          onSelect(path, e as unknown as React.MouseEvent);
        }
      }}
      className={cn(
        "relative cursor-pointer rounded-sm outline-none transition",
        "hover:ring-2 hover:ring-[var(--admin-accent)]/50",
        selected && "ring-2 ring-[var(--admin-accent)] ring-offset-1",
        className
      )}
      data-hotspot={path}
      title={label}
    >
      {children}
      {selected ? (
        <span className="pointer-events-none absolute -top-2 start-2 z-[2] rounded bg-[var(--admin-accent)] px-1.5 py-0.5 text-[10px] font-medium text-white">
          {label}
        </span>
      ) : null}
    </Tag>
  );
}
