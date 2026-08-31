"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

type FormFieldProps = {
  label: ReactNode;
  htmlFor?: string;
  required?: boolean;
  hint?: ReactNode;
  className?: string;
  children: ReactNode;
};

/** لیبل همیشه RTL و راست‌چین است؛ dir اینپوت جدا از لیبل تنظیم شود. */
export function FormField({
  label,
  htmlFor,
  required,
  hint,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2 text-right", className)}>
      <Label htmlFor={htmlFor} dir="rtl" className="block w-full text-right">
        {label}
        {required ? (
          <span className="ms-1 text-[var(--admin-danger)]" aria-hidden>
            *
          </span>
        ) : null}
      </Label>
      {children}
      {hint ? (
        <p dir="rtl" className="text-right text-xs text-[var(--admin-muted)]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
