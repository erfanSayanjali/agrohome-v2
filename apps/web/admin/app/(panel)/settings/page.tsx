"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { apiGet, apiPut, ApiError, unwrap } from "@/lib/api";
import { MediaField } from "@/components/media/media-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type SocialLink = { label: string; href: string };
type FooterLink = { title: string; href: string };
type FooterLinkGroup = { title: string; links: FooterLink[] };

type SiteSettings = {
  id: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  footerText: string | null;
  socialLinks: SocialLink[];
  footerLinkGroups: FooterLinkGroup[];
};

const emptySettings: SiteSettings = {
  id: "default",
  logoUrl: null,
  faviconUrl: null,
  footerText: "",
  socialLinks: [],
  footerLinkGroups: [],
};

function asSocialLinks(value: unknown): SocialLink[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => ({
    label: typeof item?.label === "string" ? item.label : "",
    href: typeof item?.href === "string" ? item.href : "",
  }));
}

function asFooterGroups(value: unknown): FooterLinkGroup[] {
  if (!Array.isArray(value)) return [];
  return value.map((group) => ({
    title: typeof group?.title === "string" ? group.title : "",
    links: Array.isArray(group?.links)
      ? group.links.map((link: { title?: string; href?: string }) => ({
          title: typeof link?.title === "string" ? link.title : "",
          href: typeof link?.href === "string" ? link.href : "",
        }))
      : [],
  }));
}

export default function SiteSettingsPage() {
  const [form, setForm] = useState<SiteSettings>(emptySettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiGet<{ content: SiteSettings }>("/admin/site-settings")
      .then((res) => {
        const data = unwrap(res);
        setForm({
          id: data.id || "default",
          logoUrl: data.logoUrl ?? null,
          faviconUrl: data.faviconUrl ?? null,
          footerText: data.footerText ?? "",
          socialLinks: asSocialLinks(data.socialLinks),
          footerLinkGroups: asFooterGroups(data.footerLinkGroups),
        });
      })
      .catch((err) => {
        toast.error(err instanceof ApiError ? err.message : "خطا در بارگذاری");
      })
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    try {
      const res = await apiPut<{ content: SiteSettings }>("/admin/site-settings", {
        logoUrl: form.logoUrl,
        faviconUrl: form.faviconUrl,
        footerText: form.footerText,
        socialLinks: form.socialLinks.filter((s) => s.label.trim() || s.href.trim()),
        footerLinkGroups: form.footerLinkGroups
          .map((g) => ({
            title: g.title.trim(),
            links: g.links.filter((l) => l.title.trim() || l.href.trim()),
          }))
          .filter((g) => g.title || g.links.length),
      });
      const data = unwrap(res);
      setForm({
        id: data.id || "default",
        logoUrl: data.logoUrl ?? null,
        faviconUrl: data.faviconUrl ?? null,
        footerText: data.footerText ?? "",
        socialLinks: asSocialLinks(data.socialLinks),
        footerLinkGroups: asFooterGroups(data.footerLinkGroups),
      });
      toast.success("تنظیمات ذخیره شد");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در ذخیره");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-[var(--admin-muted)]">
        <Loader2 className="h-4 w-4 animate-spin" />
        در حال بارگذاری…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">تنظیمات سایت</h1>
          <p className="text-sm text-[var(--admin-muted)]">
            لوگو، favicon، متن فوتر، شبکه‌های اجتماعی و لینک‌های فوتر
          </p>
        </div>
        <Button type="button" onClick={save} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          ذخیره
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>برندینگ</CardTitle>
          <CardDescription>لوگو و آیکون تب مرورگر</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <MediaField
            label="لوگو"
            value={form.logoUrl ? { url: form.logoUrl } : null}
            onChange={(next) => setForm((f) => ({ ...f, logoUrl: next?.url || null }))}
          />
          <MediaField
            label="Favicon"
            value={form.faviconUrl ? { url: form.faviconUrl } : null}
            onChange={(next) => setForm((f) => ({ ...f, faviconUrl: next?.url || null }))}
          />
          <div className="space-y-2">
            <Label htmlFor="footerText">متن زیر لوگو (فوتر)</Label>
            <textarea
              id="footerText"
              rows={4}
              className="flex w-full rounded-[var(--admin-radius-sm)] border border-[var(--admin-border)] bg-[var(--admin-bg-elevated)] px-3 py-2 text-sm text-[var(--admin-text)] placeholder:text-[var(--admin-muted)]"
              value={form.footerText ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, footerText: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <div>
            <CardTitle>شبکه‌های اجتماعی</CardTitle>
            <CardDescription>عنوان و لینک هر شبکه</CardDescription>
          </div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() =>
              setForm((f) => ({
                ...f,
                socialLinks: [...f.socialLinks, { label: "", href: "" }],
              }))
            }
          >
            <Plus className="h-4 w-4" />
            افزودن
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {form.socialLinks.length === 0 ? (
            <p className="text-sm text-[var(--admin-muted)]">موردی ثبت نشده است.</p>
          ) : (
            form.socialLinks.map((item, index) => (
              <div key={index} className="flex flex-col gap-2 rounded-lg border border-[var(--admin-border)] p-3 sm:flex-row sm:items-end">
                <div className="min-w-0 flex-1 space-y-2">
                  <Label>عنوان</Label>
                  <Input
                    value={item.label}
                    onChange={(e) =>
                      setForm((f) => {
                        const socialLinks = [...f.socialLinks];
                        socialLinks[index] = { ...socialLinks[index], label: e.target.value };
                        return { ...f, socialLinks };
                      })
                    }
                    placeholder="اینستاگرام"
                  />
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <Label>لینک</Label>
                  <Input
                    dir="ltr"
                    value={item.href}
                    onChange={(e) =>
                      setForm((f) => {
                        const socialLinks = [...f.socialLinks];
                        socialLinks[index] = { ...socialLinks[index], href: e.target.value };
                        return { ...f, socialLinks };
                      })
                    }
                    placeholder="https://…"
                  />
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label="حذف"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      socialLinks: f.socialLinks.filter((_, i) => i !== index),
                    }))
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <div>
            <CardTitle>گروه‌های لینک فوتر</CardTitle>
            <CardDescription>هر گروه یک عنوان و چند لینک دارد</CardDescription>
          </div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() =>
              setForm((f) => ({
                ...f,
                footerLinkGroups: [
                  ...f.footerLinkGroups,
                  { title: "", links: [{ title: "", href: "" }] },
                ],
              }))
            }
          >
            <Plus className="h-4 w-4" />
            گروه جدید
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {form.footerLinkGroups.length === 0 ? (
            <p className="text-sm text-[var(--admin-muted)]">گروهی ثبت نشده است.</p>
          ) : (
            form.footerLinkGroups.map((group, gIndex) => (
              <div key={gIndex} className="space-y-3 rounded-lg border border-[var(--admin-border)] p-4">
                <div className="flex items-end gap-2">
                  <div className="min-w-0 flex-1 space-y-2">
                    <Label>عنوان گروه</Label>
                    <Input
                      value={group.title}
                      onChange={(e) =>
                        setForm((f) => {
                          const footerLinkGroups = [...f.footerLinkGroups];
                          footerLinkGroups[gIndex] = {
                            ...footerLinkGroups[gIndex],
                            title: e.target.value,
                          };
                          return { ...f, footerLinkGroups };
                        })
                      }
                      placeholder="دسترسی سریع"
                    />
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label="حذف گروه"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        footerLinkGroups: f.footerLinkGroups.filter((_, i) => i !== gIndex),
                      }))
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {group.links.map((link, lIndex) => (
                  <div key={lIndex} className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    <div className="min-w-0 flex-1 space-y-2">
                      <Label>عنوان لینک</Label>
                      <Input
                        value={link.title}
                        onChange={(e) =>
                          setForm((f) => {
                            const footerLinkGroups = [...f.footerLinkGroups];
                            const links = [...footerLinkGroups[gIndex].links];
                            links[lIndex] = { ...links[lIndex], title: e.target.value };
                            footerLinkGroups[gIndex] = { ...footerLinkGroups[gIndex], links };
                            return { ...f, footerLinkGroups };
                          })
                        }
                      />
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <Label>آدرس</Label>
                      <Input
                        dir="ltr"
                        value={link.href}
                        onChange={(e) =>
                          setForm((f) => {
                            const footerLinkGroups = [...f.footerLinkGroups];
                            const links = [...footerLinkGroups[gIndex].links];
                            links[lIndex] = { ...links[lIndex], href: e.target.value };
                            footerLinkGroups[gIndex] = { ...footerLinkGroups[gIndex], links };
                            return { ...f, footerLinkGroups };
                          })
                        }
                        placeholder="/products"
                      />
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      aria-label="حذف لینک"
                      onClick={() =>
                        setForm((f) => {
                          const footerLinkGroups = [...f.footerLinkGroups];
                          footerLinkGroups[gIndex] = {
                            ...footerLinkGroups[gIndex],
                            links: footerLinkGroups[gIndex].links.filter((_, i) => i !== lIndex),
                          };
                          return { ...f, footerLinkGroups };
                        })
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    setForm((f) => {
                      const footerLinkGroups = [...f.footerLinkGroups];
                      footerLinkGroups[gIndex] = {
                        ...footerLinkGroups[gIndex],
                        links: [...footerLinkGroups[gIndex].links, { title: "", href: "" }],
                      };
                      return { ...f, footerLinkGroups };
                    })
                  }
                >
                  <Plus className="h-4 w-4" />
                  لینک
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
