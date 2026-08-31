"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { RemoveScroll } from "react-remove-scroll";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type ComboboxOption = { value: string; label: string };

type ComboboxProps = {
  options: ComboboxOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  allowClear?: boolean;
};

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "انتخاب کنید",
  searchPlaceholder = "جستجو…",
  emptyText = "موردی یافت نشد",
  className,
  allowClear,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const selected = options.find((o) => o.value === value);
  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(q.trim().toLowerCase())
  );

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <Button
          type="button"
          variant="field"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between text-start", className)}
        >
          <span className={cn("truncate", !selected && "text-[var(--admin-muted)]")}>
            {selected?.label || placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 opacity-60" />
        </Button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          dir="rtl"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          className="z-[70] w-[var(--radix-popover-trigger-width)] rounded-[var(--admin-radius-sm)] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-2 text-start shadow-[var(--admin-shadow)]"
        >
          <RemoveScroll allowPinchZoom enabled={open} removeScrollBar={false}>
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={searchPlaceholder}
              className="mb-2"
            />
            <div
              className="max-h-56 overflow-y-auto overscroll-contain"
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
            >
              {allowClear && value ? (
                <button
                  type="button"
                  className="mb-1 w-full rounded-md px-2 py-2 text-start text-sm text-[var(--admin-muted)] hover:bg-white/8"
                  onClick={() => {
                    onChange("");
                    setOpen(false);
                  }}
                >
                  پاک کردن انتخاب
                </button>
              ) : null}
              {filtered.length === 0 ? (
                <p className="px-2 py-3 text-sm text-[var(--admin-muted)]">{emptyText}</p>
              ) : (
                filtered.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className="flex w-full items-center justify-between rounded-md px-2 py-2 text-start text-sm hover:bg-white/8"
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                      setQ("");
                    }}
                  >
                    {opt.label}
                    {value === opt.value ? <Check className="h-4 w-4" /> : null}
                  </button>
                ))
              )}
            </div>
          </RemoveScroll>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
