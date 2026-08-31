"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { apiGet, apiPut, ApiError, unwrap } from "@/lib/api";
import { MediaField } from "@/components/media/media-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type SocialLink = { label: string; href: string };
type NavLink = { title: string; href: string };
type FooterLink = { title: string; href: string };
type FooterLinkGroup = { title: string; links: FooterLink[] };

type SiteSettings = {
  id: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  footerText: string | null;
  socialLinks: SocialLink[];
  headerLinks: NavLink[];
  footerLinkGroups: FooterLinkGroup[];
};

const DEFAULT_HEADER_LINKS: NavLink[] = [
  { title: "صفحه اصلی", href: "/" },
  { title: "محصولات", href: "/products" },
  { title: "وبلاگ", href: "/blogs" },
  { title: "درباره ما", href: "/about" },
  { title: "تماس با ما", href: "/contact" },
];

const emptySettings: SiteSettings = {
  id: "default",
  logoUrl: null,
  faviconUrl: null,
  footerText: "",
  socialLinks: [],
  headerLinks: DEFAULT_HEADER_LINKS,
  footerLinkGroups: [],
};

function asSocialLinks(value: unknown): SocialLink[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => ({
    label: typeof item?.label === "string" ? item.label : "",
    href: typeof item?.href === "string" ? item.href : "",
  }));
}

function asNavLinks(value: unknown): NavLink[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => ({
    title: typeof item?.title === "string" ? item.title : "",
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

function normalizeSettings(data: Partial<SiteSettings> & { id?: string }): SiteSettings {
  const headerLinks = asNavLinks(data.headerLinks);
  return {
    id: data.id || "default",
    logoUrl: data.logoUrl ?? null,
    faviconUrl: data.faviconUrl ?? null,
    footerText: data.footerText ?? "",
    socialLinks: asSocialLinks(data.socialLinks),
    headerLinks: headerLinks.length ? headerLinks : DEFAULT_HEADER_LINKS,
    footerLinkGroups: asFooterGroups(data.footerLinkGroups),
  };
}

export default function SiteSettingsPage() {
  const [form, setForm] = useState<SiteSettings>(emptySettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiGet<{ content: SiteSettings }>("/admin/site-settings")
      .then((res) => {
        setForm(normalizeSettings(unwrap(res)));
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
        headerLinks: form.headerLinks.filter((l) => l.title.trim() || l.href.trim()),
        footerLinkGroups: form.footerLinkGroups
          .map((g) => ({
            title: g.title.trim(),
            links: g.links.filter((l) => l.title.trim() || l.href.trim()),
          }))
          .filter((g) => g.title || g.links.length),
      });
      setForm(normalizeSettings(unwrap(res)));
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
            لوگو، favicon، لینک‌های هدر، متن فوتر، شبکه‌های اجتماعی و لینک‌های فوتر
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
          <FormField label="متن زیر لوگو (فوتر)" htmlFor="footerText">
            <Textarea
              id="footerText"
              rows={4}
              value={form.footerText ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, footerText: e.target.value }))}
            />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <div>
            <CardTitle>لینک‌های هدر</CardTitle>
            <CardDescription>
              منوی ناوبری سایت؛ لینک <span dir="ltr">/products</span> به‌صورت مگامنو دسته‌بندی نمایش داده می‌شود
            </CardDescription>
          </div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() =>
              setForm((f) => ({
                ...f,
                headerLinks: [...f.headerLinks, { title: "", href: "" }],
              }))
            }
          >
            <Plus className="h-4 w-4" />
            افزودن
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {form.headerLinks.length === 0 ? (
            <p className="text-sm text-[var(--admin-muted)]">موردی ثبت نشده است.</p>
          ) : (
            form.headerLinks.map((item, index) => (
              <div
                key={index}
                className="flex flex-col gap-2 rounded-lg border border-[var(--admin-border)] p-3 sm:flex-row sm:items-end"
              >
                <FormField label="عنوان" className="min-w-0 flex-1">
                  <Input
                    value={item.title}
                    onChange={(e) =>
                      setForm((f) => {
                        const headerLinks = [...f.headerLinks];
                        headerLinks[index] = { ...headerLinks[index], title: e.target.value };
                        return { ...f, headerLinks };
                      })
                    }
                    placeholder="وبلاگ"
                  />
                </FormField>
                <FormField label="آدرس" className="min-w-0 flex-1">
                  <Input
                    dir="ltr"
                    value={item.href}
                    onChange={(e) =>
                      setForm((f) => {
                        const headerLinks = [...f.headerLinks];
                        headerLinks[index] = { ...headerLinks[index], href: e.target.value };
                        return { ...f, headerLinks };
                      })
                    }
                    placeholder="/blogs"
                  />
                </FormField>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label="حذف"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      headerLinks: f.headerLinks.filter((_, i) => i !== index),
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
              <div
                key={index}
                className="flex flex-col gap-2 rounded-lg border border-[var(--admin-border)] p-3 sm:flex-row sm:items-end"
              >
                <FormField label="عنوان" className="min-w-0 flex-1">
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
                </FormField>
                <FormField label="لینک" className="min-w-0 flex-1">
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
                </FormField>
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
                  <FormField label="عنوان گروه" className="min-w-0 flex-1">
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
                  </FormField>
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
                    <FormField label="عنوان لینک" className="min-w-0 flex-1">
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
                    </FormField>
                    <FormField label="آدرس" className="min-w-0 flex-1">
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
                    </FormField>
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
