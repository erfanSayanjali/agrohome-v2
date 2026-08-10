"use client";

import { useEffect, useState } from "react";
import { Filter, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { ColumnFilterDef, FilterValue } from "@/lib/table-filters";
import {
  getSelectFilterDisplay,
  getTextFilterDisplay,
  isFilterActive,
  toTextFilterValue,
} from "@/lib/table-filters";

type ColumnFilterButtonProps = {
  label: string;
  filterKey: string;
  config: ColumnFilterDef;
  value: FilterValue | undefined;
  onChange: (key: string, value: FilterValue | undefined) => void;
};

export function ColumnFilterButton({
  label,
  filterKey,
  config,
  value,
  onChange,
}: ColumnFilterButtonProps) {
  const type = config.type || "text";
  const active = isFilterActive(value);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(getTextFilterDisplay(value));

  useEffect(() => {
    if (open) setDraft(getTextFilterDisplay(value));
  }, [open, value]);

  function applyText() {
    onChange(filterKey, toTextFilterValue(draft));
    setOpen(false);
  }

  function clear() {
    onChange(filterKey, undefined);
    setDraft("");
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors",
            active
              ? "bg-[var(--admin-accent)]/20 text-[var(--admin-accent)]"
              : "text-[var(--admin-muted)] hover:bg-white/8 hover:text-[var(--admin-text)]"
          )}
          aria-label={`فیلتر ${label}`}
          aria-pressed={active}
          onClick={(e) => e.stopPropagation()}
        >
          <Filter className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="space-y-3"
        dir="rtl"
        onOpenAutoFocus={(e) => {
          if (type !== "text") e.preventDefault();
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-[var(--admin-muted)]">فیلتر «{label}»</p>
          {active ? (
            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs text-[var(--admin-muted)] hover:text-[var(--admin-danger)]"
              onClick={clear}
            >
              <X className="h-3 w-3" />
              پاک کردن
            </button>
          ) : null}
        </div>

        {type === "text" ? (
          <div className="space-y-2">
            <Label htmlFor={`col-filter-${filterKey}`} className="sr-only">
              {label}
            </Label>
            <Input
              id={`col-filter-${filterKey}`}
              value={draft}
              placeholder={config.placeholder || `جستجو در ${label}…`}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  applyText();
                }
              }}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button type="button" size="sm" variant="secondary" onClick={() => setOpen(false)}>
                انصراف
              </Button>
              <Button type="button" size="sm" onClick={applyText}>
                اعمال
              </Button>
            </div>
          </div>
        ) : null}

        {type === "select" ? (
          <Select
            value={getSelectFilterDisplay(value) || "__all__"}
            onValueChange={(v) => {
              onChange(filterKey, v === "__all__" ? undefined : v);
              setOpen(false);
            }}
          >
            <SelectTrigger aria-label={label}>
              <SelectValue placeholder="همه" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">همه</SelectItem>
              {(config.options || []).map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}

        {type === "boolean" ? (
          <div className="grid grid-cols-3 gap-1.5">
            {(
              [
                { v: undefined, label: "همه" },
                { v: "true", label: "بله" },
                { v: "false", label: "خیر" },
              ] as const
            ).map((opt) => {
              const current = getSelectFilterDisplay(value);
              const selected =
                opt.v === undefined
                  ? !active
                  : current === opt.v ||
                    (opt.v === "true" && value === true) ||
                    (opt.v === "false" && value === false);
              return (
                <button
                  key={opt.label}
                  type="button"
                  className={cn(
                    "rounded-md border px-2 py-1.5 text-xs transition-colors",
                    selected
                      ? "border-[var(--admin-accent)] bg-[var(--admin-accent)]/15 text-[var(--admin-accent)]"
                      : "border-[var(--admin-border)] text-[var(--admin-muted)] hover:bg-white/5"
                  )}
                  onClick={() => {
                    onChange(filterKey, opt.v);
                    setOpen(false);
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
