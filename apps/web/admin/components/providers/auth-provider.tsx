"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { apiGet, apiPost, ApiError } from "@/lib/api";
import { ShellSkeleton } from "@/components/ui/skeletons";

export type AuthUser = {
  id: string;
  phone: string;
  firstName?: string | null;
  lastName?: string | null;
  roleId?: string | null;
  role?: { id: string; title: string } | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(async () => {
    try {
      const res = await apiGet<{ content: AuthUser }>("/auth/me");
      setUser(res.content);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const logout = React.useCallback(async () => {
    try {
      await apiPost("/auth/logout");
    } finally {
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (loading) return;
    if (!user?.roleId) {
      router.replace(`/login?next=${encodeURIComponent(pathname || "/")}`);
    }
  }, [loading, user, router, pathname]);

  if (loading) return <ShellSkeleton />;
  if (!user?.roleId) return <ShellSkeleton />;
  return <>{children}</>;
}

export function isUnauthorized(err: unknown) {
  return err instanceof ApiError && err.status === 401;
}
