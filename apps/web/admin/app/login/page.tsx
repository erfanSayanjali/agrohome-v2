"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { apiPost, ApiError, unwrap } from "@/lib/api";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const nextParam = search.get("next") || "/";

  function safeNextPath(value: string): string {
    if (!value.startsWith("/") || value.startsWith("//")) return "/";
    return value;
  }

  const next = safeNextPath(nextParam);
  const { refresh } = useAuth();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [devHint, setDevHint] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function afterLogin() {
    await refresh();
    router.replace(next);
  }

  async function loginWithPassword(e: FormEvent) {
    e.preventDefault();
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
  }

  async function requestOtp() {
    setBusy(true);
    try {
      const res = await apiPost<{ content: { message?: string } }>(
        "/auth/request-otp",
        { phone }
      );
      setOtpSent(true);
      setDevHint("کد را از لاگ سرور API کپی کنید (Phase 1 بدون SMS).");
      toast.success(unwrap(res)?.message || "کد ارسال شد");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا");
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp() {
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

            <TabsContent value="password">
              <form className="space-y-4" onSubmit={loginWithPassword}>
                <FormField label="موبایل" htmlFor="phone-pass">
                  <Input
                    id="phone-pass"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="09xxxxxxxxx"
                    dir="ltr"
                    autoComplete="username"
                  />
                </FormField>
                <FormField label="رمز عبور" htmlFor="password">
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    dir="ltr"
                    autoComplete="current-password"
                  />
                </FormField>
                <Button type="submit" className="w-full cursor-pointer" disabled={busy}>
                  ورود
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="otp">
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  void (otpSent ? verifyOtp() : requestOtp());
                }}
              >
                <FormField label="موبایل" htmlFor="phone-otp">
                  <Input
                    id="phone-otp"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="09xxxxxxxxx"
                    dir="ltr"
                    autoComplete="tel"
                  />
                </FormField>
                {otpSent ? (
                  <FormField label="کد تأیید" htmlFor="otp">
                    <Input
                      id="otp"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      dir="ltr"
                      autoComplete="one-time-code"
                    />
                    {devHint ? (
                      <p className="rounded-md bg-white/5 px-3 py-2 text-xs text-[var(--admin-muted)]">
                        در حالت توسعه کد در کنسول API چاپ می‌شود. {devHint}
                      </p>
                    ) : null}
                  </FormField>
                ) : null}
                <div className="flex gap-2">
                  <Button
                    type={otpSent ? "button" : "submit"}
                    variant="secondary"
                    className="flex-1 cursor-pointer"
                    disabled={busy}
                    onClick={otpSent ? () => void requestOtp() : undefined}
                  >
                    دریافت کد
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 cursor-pointer"
                    disabled={busy || !otpSent}
                  >
                    تأیید
                  </Button>
                </div>
              </form>
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
