"use client";

import { Suspense } from "react";
import { RequireAdmin } from "@/components/providers/auth-provider";
import { AppShell } from "@/components/shell/app-shell";
import { ShellSkeleton } from "@/components/ui/skeletons";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAdmin>
      <Suspense fallback={<ShellSkeleton />}>
        <AppShell>{children}</AppShell>
      </Suspense>
    </RequireAdmin>
  );
}
