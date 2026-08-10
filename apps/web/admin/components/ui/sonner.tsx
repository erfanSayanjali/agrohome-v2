"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      dir="rtl"
      position="top-center"
      toastOptions={{
        classNames: {
          toast:
            "bg-[var(--admin-surface)] border border-[var(--admin-border)] text-[var(--admin-text)]",
        },
      }}
    />
  );
}
