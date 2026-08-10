"use client";

import { AuthProvider } from "@/components/providers/auth-provider";
import { PersianDigits } from "@/components/providers/persian-digits";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppToaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <TooltipProvider delayDuration={200}>
        <PersianDigits>
          {children}
          <AppToaster />
        </PersianDigits>
      </TooltipProvider>
    </AuthProvider>
  );
}
