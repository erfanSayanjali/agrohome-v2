"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { apiPost, ApiError, unwrap } from "@/lib/api";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/";
  const { refresh } = useAuth();

  const [phone, setPhone] = useState("09120000000");
  const [password, setPassword] = useState("admin123");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [devHint, setDevHint] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function afterLogin() {
    await refresh();
    router.replace(next);
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <p className="text-sm font-bold text-[var(--admin-accent)]">آگروهوم</p>
          <CardTitle className="text-2xl">ورود به پنل</CardTitle>
          <CardDescription>با رمز عبور یا کد یکبارمصرف وارد شوید.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="password">
            <TabsList className="w-full">
              <TabsTrigger value="password" className="flex-1">
                رمز عبور
              </TabsTrigger>
              <TabsTrigger value="otp" className="flex-1">
                کد یکبارمصرف
              </TabsTrigger>
            </TabsList>

            <TabsContent value="password" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone-pass">موبایل</Label>
                <Input
                  id="phone-pass"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="09xxxxxxxxx"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">رمز عبور</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  dir="ltr"
                />
              </div>
              <Button
                type="button"
                className="w-full"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await apiPost("/auth/login-password", { phone, password });
                    toast.success("ورود موفق");
                    await afterLogin();
                  } catch (err) {
                    toast.error(err instanceof ApiError ? err.message : "ورود ناموفق");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                ورود
              </Button>
            </TabsContent>

            <TabsContent value="otp" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone-otp">موبایل</Label>
                <Input
                  id="phone-otp"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="09xxxxxxxxx"
                  dir="ltr"
                />
              </div>
              {otpSent ? (
                <div className="space-y-2">
                  <Label htmlFor="otp">کد تأیید</Label>
                  <Input
                    id="otp"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    dir="ltr"
                  />
                  {devHint ? (
                    <p className="rounded-md bg-white/5 px-3 py-2 text-xs text-[var(--admin-muted)]">
                      در حالت توسعه کد در کنسول API چاپ می‌شود. {devHint}
                    </p>
                  ) : null}
                </div>
              ) : null}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      const res = await apiPost<{ content: { message?: string } }>(
                        "/auth/request-otp",
                        { phone }
                      );
                      setOtpSent(true);
                      setDevHint(
                        "کد را از لاگ سرور API کپی کنید (Phase 1 بدون SMS)."
                      );
                      toast.success(unwrap(res)?.message || "کد ارسال شد");
                    } catch (err) {
                      toast.error(err instanceof ApiError ? err.message : "خطا");
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  دریافت کد
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  disabled={busy || !otpSent}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await apiPost("/auth/verify-otp", { phone, code: otpCode });
                      toast.success("ورود موفق");
                      await afterLogin();
                    } catch (err) {
                      toast.error(err instanceof ApiError ? err.message : "کد نامعتبر");
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  تأیید
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center">در حال بارگذاری…</div>}>
      <LoginForm />
    </Suspense>
  );
}
