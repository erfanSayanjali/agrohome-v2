"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Box,
  Loader2,
  Plus,
  Save,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { apiDelete, apiGet, apiPost, apiPut, ApiError, unwrap } from "@/lib/api";
import { formatFaNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MediaField } from "@/components/media/media-field";
import { AsyncSelect } from "@/components/ui/async-select";
import {
  AsyncMultiSelect,
  type AsyncMultiSelectValue,
} from "@/components/ui/async-multi-select";
import { FormSkeleton } from "@/components/ui/skeletons";
import { SortableList } from "@/components/ui/sortable-list";
import {
  DEFAULT_PACKAGE_UNIT,
  normalizePackageUnit,
  PACKAGE_UNITS,
} from "@/lib/package-units";
import { categoryDisplayLabel, mapCategoryOption } from "@/lib/category-option";
import { SeoFields } from "@/components/seo/seo-fields";
import {
  buildSeoPath,
  emptySeoForm,
  fetchSeoByTarget,
  seoRecordToForm,
  upsertEntitySeo,
  type SeoFormValues,
} from "@/lib/seo";
import type { MediaRef } from "@agrohome/shared";
import { toMediaRef } from "@agrohome/shared";

export type ProductRow = {
  id: string;
  title: string;
  slug: string;
  status: string;
  isFeatured: boolean;
  subtitle?: string | null;
  description?: string | null;
  media?: MediaRef | null;
  sortOrder?: number;
  categories?: Array<{
    categoryId: string;
    category?: {
      id: string;
      title?: string;
      parent?: { title?: string | null } | null;
    };
  }>;
  packages?: Array<{
    id: string;
    value: number;
    unit: string;
    sortOrder?: number;
  }>;
  specs?: Array<{
    id: string;
    specificationId: string;
    value: string;
    highlight?: boolean;
    sortOrder?: number;
    specification?: { title?: string };
  }>;
};

type PackageDraft = {
  id?: string;
  localId: string;
  value: number | "";
  unit: string;
  sortOrder: number;
};

type SpecDraft = {
  id?: string;
  localId: string;
  specificationId: string;
  specificationTitle?: string;
  value: string;
  highlight: boolean;
  sortOrder: number;
};

type ProductFormState = {
  title: string;
  slug: string;
  subtitle: string;
  description: string;
  media: MediaRef | null;
  status: string;
  isFeatured: boolean;
  sortOrder: number | "";
};

const emptyForm = (): ProductFormState => ({
  title: "",
  slug: "",
  subtitle: "",
  description: "",
  media: null,
  status: "AVAILABLE",
  isFeatured: false,
  sortOrder: 0,
});

function uid() {
  return `local-${Math.random().toString(36).slice(2, 9)}`;
}

type ProductEditorProps = {
  open: boolean;
  mode: "create" | "edit";
  productId?: string | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

export function ProductEditor({
  open,
  mode,
  productId,
  onOpenChange,
  onSaved,
}: ProductEditorProps) {
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [packages, setPackages] = useState<PackageDraft[]>([]);
  const [specs, setSpecs] = useState<SpecDraft[]>([]);
  const [tab, setTab] = useState("info");
  const [seo, setSeo] = useState<SeoFormValues>(emptySeoForm());
  const [categories, setCategories] = useState<AsyncMultiSelectValue[]>([]);

  const load = useCallback(async () => {
    if (mode !== "edit" || !productId) {
      setForm(emptyForm());
      setPackages([]);
      setSpecs([]);
      setCategories([]);
      setSeo(emptySeoForm());
      return;
    }
    setLoading(true);
    try {
      const res = await apiGet<{ content: ProductRow }>(`/admin/products/${productId}`);
      const p = unwrap(res);
      setForm({
        title: p.title || "",
        slug: p.slug || "",
        subtitle: p.subtitle || "",
        description: p.description || "",
        media: toMediaRef(p.media),
        status: p.status || "AVAILABLE",
        isFeatured: Boolean(p.isFeatured),
        sortOrder: p.sortOrder ?? 0,
      });
      setCategories(
        (p.categories || [])
          .map((link) => {
            const cat = link.category;
            const id = cat?.id || link.categoryId;
            if (!id) return null;
            const label = categoryDisplayLabel({
              title: cat?.title,
              parentTitle: cat?.parent?.title,
            });
            return {
              value: id,
              label: label || id,
              meta: cat?.parent?.title ? `زیرمجموعهٔ ${cat.parent.title}` : undefined,
            } satisfies AsyncMultiSelectValue;
          })
          .filter(Boolean) as AsyncMultiSelectValue[]
      );
      setPackages(
        (p.packages || []).map((pkg, index) => ({
          id: pkg.id,
          localId: pkg.id,
          value: pkg.value,
          unit: normalizePackageUnit(pkg.unit),
          sortOrder: pkg.sortOrder ?? index,
        }))
      );
      setSpecs(
        (p.specs || []).map((s, index) => ({
          id: s.id,
          localId: s.id,
          specificationId: s.specificationId,
          specificationTitle: s.specification?.title,
          value: s.value,
          highlight: Boolean(s.highlight),
          sortOrder: s.sortOrder ?? index,
        }))
      );
      try {
        const seoRecord = await fetchSeoByTarget({
          targetType: "product",
          targetId: productId,
        });
        setSeo(seoRecordToForm(seoRecord, buildSeoPath("product", p.slug || "")));
      } catch {
        setSeo(emptySeoForm({ targetPath: buildSeoPath("product", p.slug || "") }));
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در بارگذاری محصول");
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }, [mode, productId, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    setTab("info");
    void load();
  }, [open, load]);

  function patchForm<K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function persistPackage(productIdValue: string, pkg: PackageDraft, index: number) {
    const body = {
      productId: productIdValue,
      value: Number(pkg.value),
      unit: pkg.unit,
      sortOrder: index,
    };
    if (pkg.id) {
      const res = await apiPut<{ content: { id: string } }>(`/admin/packages/${pkg.id}`, body);
      return unwrap(res).id;
    }
    const res = await apiPost<{ content: { id: string } }>("/admin/packages", body);
    return unwrap(res).id;
  }

  async function persistSpec(productIdValue: string, spec: SpecDraft, index: number) {
    const body = {
      productId: productIdValue,
      specificationId: spec.specificationId,
      value: spec.value,
      highlight: spec.highlight,
      sortOrder: index,
    };
    if (spec.id) {
      const res = await apiPut<{ content: { id: string } }>(
        `/admin/product-specifications/${spec.id}`,
        body
      );
      return unwrap(res).id;
    }
    const res = await apiPost<{ content: { id: string } }>("/admin/product-specifications", body);
    return unwrap(res).id;
  }

  async function handleSave() {
    if (!form.title.trim()) {
      toast.error("عنوان الزامی است");
      setTab("info");
      return;
    }
    if (!form.slug.trim()) {
      toast.error("اسلاگ الزامی است");
      setTab("info");
      return;
    }
    for (const pkg of packages) {
      if (pkg.value === "" || Number.isNaN(Number(pkg.value)) || !pkg.unit.trim()) {
        toast.error("بسته‌ها باید مقدار و واحد معتبر داشته باشند");
        setTab("packages");
        return;
      }
    }
    for (const spec of specs) {
      if (!spec.specificationId || !spec.value.trim()) {
        toast.error("هر مشخصه باید نوع مشخصه و مقدار داشته باشد");
        setTab("specs");
        return;
      }
    }

    setBusy(true);
    try {
      const categoryIds = categories.map((c) => c.value);
      const body = {
        title: form.title.trim(),
        slug: form.slug.trim(),
        subtitle: form.subtitle || null,
        description: form.description || null,
        media: toMediaRef(form.media),
        status: form.status,
        isFeatured: form.isFeatured,
        sortOrder: Number(form.sortOrder || 0),
        ...(mode === "create" ? { categoryIds } : {}),
      };

      let id = productId || "";
      if (mode === "create") {
        const res = await apiPost<{ content: { id: string } }>("/admin/products", body);
        id = unwrap(res).id;
      } else {
        await apiPut(`/admin/products/${id}`, body);
        await apiPut(`/admin/products/${id}/relations`, { categoryIds });
      }

      for (let i = 0; i < packages.length; i++) {
        const newId = await persistPackage(id, packages[i], i);
        packages[i].id = newId;
        packages[i].sortOrder = i;
      }
      for (let i = 0; i < specs.length; i++) {
        const newId = await persistSpec(id, specs[i], i);
        specs[i].id = newId;
        specs[i].sortOrder = i;
      }

      const targetPath = buildSeoPath("product", form.slug.trim());
      await upsertEntitySeo({
        targetType: "product",
        targetId: id,
        targetPath,
        form: { ...seo, targetPath },
      });

      toast.success(mode === "create" ? "محصول ایجاد شد" : "محصول ذخیره شد");
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "ذخیره ناموفق بود");
    } finally {
      setBusy(false);
    }
  }

  async function removePackage(pkg: PackageDraft) {
    if (pkg.id) {
      try {
        await apiDelete(`/admin/packages/${pkg.id}`);
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "حذف بسته ناموفق");
        return;
      }
    }
    setPackages((prev) => prev.filter((p) => p.localId !== pkg.localId));
  }

  async function removeSpec(spec: SpecDraft) {
    if (spec.id) {
      try {
        await apiDelete(`/admin/product-specifications/${spec.id}`);
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "حذف مشخصه ناموفق");
        return;
      }
    }
    setSpecs((prev) => prev.filter((s) => s.localId !== spec.localId));
  }

  const packageCount = packages.length;
  const specCount = specs.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir="rtl"
        className="flex max-h-[92vh] w-[calc(100%-1.5rem)] max-w-5xl flex-col gap-0 overflow-hidden p-0 text-start sm:max-w-5xl [direction:rtl]"
      >
        <div className="relative overflow-hidden border-b border-[var(--admin-border)] bg-gradient-to-l from-[var(--admin-accent)]/10 via-transparent to-[var(--admin-surface-2)]/40 px-6 py-5">
          <DialogHeader className="text-start">
            <DialogTitle className="text-xl">
              {mode === "create" ? "ایجاد محصول جدید" : "ویرایش محصول"}
            </DialogTitle>
            <p className="text-sm text-[var(--admin-muted)]">
              اطلاعات پایه، بسته‌ها، مشخصات و SEO را در یکجا مدیریت کنید
            </p>
          </DialogHeader>
        </div>

        {loading ? (
          <div className="p-6">
            <FormSkeleton fields={6} />
          </div>
        ) : (
          <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col">
            <div className="border-b border-[var(--admin-border)] px-6 pt-3">
              <TabsList className="h-auto w-full justify-start gap-1 bg-transparent p-0">
                <TabsTrigger
                  value="info"
                  className="rounded-b-none rounded-t-lg border border-transparent px-4 data-[state=active]:border-[var(--admin-border)] data-[state=active]:border-b-[var(--admin-surface)] data-[state=active]:bg-[var(--admin-surface)]"
                >
                  اطلاعات
                </TabsTrigger>
                <TabsTrigger
                  value="packages"
                  className="gap-2 rounded-b-none rounded-t-lg border border-transparent px-4 data-[state=active]:border-[var(--admin-border)] data-[state=active]:border-b-[var(--admin-surface)] data-[state=active]:bg-[var(--admin-surface)]"
                >
                  <Box className="h-3.5 w-3.5" />
                  بسته‌ها
                  <Badge variant={packageCount ? "accent" : "muted"}>{formatFaNumber(packageCount)}</Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="specs"
                  className="gap-2 rounded-b-none rounded-t-lg border border-transparent px-4 data-[state=active]:border-[var(--admin-border)] data-[state=active]:border-b-[var(--admin-surface)] data-[state=active]:bg-[var(--admin-surface)]"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  مشخصات
                  <Badge variant={specCount ? "accent" : "muted"}>{formatFaNumber(specCount)}</Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="seo"
                  className="rounded-b-none rounded-t-lg border border-transparent px-4 data-[state=active]:border-[var(--admin-border)] data-[state=active]:border-b-[var(--admin-surface)] data-[state=active]:bg-[var(--admin-surface)]"
                >
                  SEO
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5" dir="rtl">
              <TabsContent value="info" className="mt-0 space-y-4" dir="rtl">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2" dir="rtl">
                  <div className="space-y-2 text-start">
                    <Label>
                      عنوان <span className="text-[var(--admin-danger)]">*</span>
                    </Label>
                    <Input
                      value={form.title}
                      onChange={(e) => patchForm("title", e.target.value)}
                      dir="rtl"
                    />
                  </div>
                  <div className="space-y-2 text-start">
                    <Label>
                      اسلاگ <span className="text-[var(--admin-danger)]">*</span>
                    </Label>
                    <Input
                      value={form.slug}
                      onChange={(e) => {
                        const slug = e.target.value;
                        patchForm("slug", slug);
                        setSeo((prev) => ({
                          ...prev,
                          targetPath: buildSeoPath("product", slug),
                        }));
                      }}
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2 text-start sm:col-span-2">
                    <Label>زیرعنوان</Label>
                    <Input
                      value={form.subtitle}
                      onChange={(e) => patchForm("subtitle", e.target.value)}
                      dir="rtl"
                    />
                  </div>
                  <div className="space-y-2 text-start sm:col-span-2">
                    <Label>توضیحات</Label>
                    <Textarea
                      value={form.description}
                      onChange={(e) => patchForm("description", e.target.value)}
                      className="min-h-[120px]"
                      dir="rtl"
                    />
                  </div>
                  <div className="space-y-2 text-start sm:col-span-2">
                    <Label>دسته‌بندی‌ها</Label>
                    <AsyncMultiSelect
                      path="/admin/product-categories"
                      values={categories}
                      onChange={setCategories}
                      placeholder="جستجو و انتخاب دسته…"
                      searchPlaceholder="نام دسته…"
                      mapItem={mapCategoryOption}
                      sort="title"
                    />
                  </div>
                  <div className="space-y-2 text-start sm:col-span-2">
                    <MediaField
                      label="تصویر شاخص"
                      value={form.media}
                      onChange={(next) => patchForm("media", next)}
                    />
                  </div>
                  <div className="space-y-2 text-start">
                    <Label>وضعیت</Label>
                    <Select
                      value={form.status}
                      onValueChange={(v) => patchForm("status", v)}
                      dir="rtl"
                    >
                      <SelectTrigger dir="rtl" className="text-start">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent dir="rtl">
                        <SelectItem value="AVAILABLE">موجود</SelectItem>
                        <SelectItem value="UNAVAILABLE">ناموجود</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 text-start sm:col-span-2">
                    <Label>ویژه</Label>
                    <div
                      dir="rtl"
                      className="flex h-10 items-center justify-between gap-3 rounded-[var(--admin-radius-sm)] border border-[var(--admin-border)] bg-[var(--admin-bg-elevated)] px-3"
                    >
                      <span className="text-sm text-[var(--admin-muted)]">
                        {form.isFeatured ? "فعال" : "غیرفعال"}
                      </span>
                      <Switch
                        checked={form.isFeatured}
                        onCheckedChange={(v) => patchForm("isFeatured", v)}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="packages" className="mt-0 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">بسته‌های محصول</h3>
                    <p className="text-sm text-[var(--admin-muted)]">
                      با دستگیره جابجا کنید تا ترتیب ذخیره شود
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() =>
                      setPackages((prev) => [
                        ...prev,
                        {
                          localId: uid(),
                          value: "",
                          unit: DEFAULT_PACKAGE_UNIT,
                          sortOrder: prev.length,
                        },
                      ])
                    }
                  >
                    <Plus className="h-4 w-4" />
                    بسته جدید
                  </Button>
                </div>

                {packages.length === 0 ? (
                  <EmptyBlock
                    icon={<Box className="h-5 w-5" />}
                    title="هنوز بسته‌ای نیست"
                    hint="اولین بسته را اضافه کنید"
                  />
                ) : (
                  <SortableList
                    items={packages}
                    onReorder={(next) =>
                      setPackages(next.map((item, index) => ({ ...item, sortOrder: index })))
                    }
                    renderItem={(pkg, index, handle) => (
                      <div className="group relative overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-bg-elevated)]/55 p-4 transition hover:border-[var(--admin-border-strong)]">
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            {handle}
                            <Badge variant="muted">بسته {formatFaNumber(index + 1)}</Badge>
                          </div>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            aria-label="حذف بسته"
                            onClick={() => void removePackage(pkg)}
                          >
                            <Trash2 className="h-4 w-4 text-[var(--admin-danger)]" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label>مقدار</Label>
                            <Input
                              type="number"
                              value={pkg.value}
                              onChange={(e) => {
                                const v = e.target.value === "" ? "" : Number(e.target.value);
                                setPackages((prev) =>
                                  prev.map((p) =>
                                    p.localId === pkg.localId ? { ...p, value: v } : p
                                  )
                                );
                              }}
                              dir="ltr"
                              placeholder="مثلاً 1"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>واحد</Label>
                            <Select
                              value={normalizePackageUnit(pkg.unit)}
                              onValueChange={(unit) =>
                                setPackages((prev) =>
                                  prev.map((p) =>
                                    p.localId === pkg.localId ? { ...p, unit } : p
                                  )
                                )
                              }
                              dir="rtl"
                            >
                              <SelectTrigger aria-label="واحد بسته" dir="rtl" className="text-start">
                                <SelectValue placeholder="انتخاب واحد" />
                              </SelectTrigger>
                              <SelectContent dir="rtl">
                                {PACKAGE_UNITS.map((u) => (
                                  <SelectItem key={u.value} value={u.value}>
                                    {u.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    )}
                  />
                )}
              </TabsContent>

              <TabsContent value="specs" className="mt-0 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">مشخصات محصول</h3>
                    <p className="text-sm text-[var(--admin-muted)]">
                      درگ کنید تا ترتیب نمایش مشخصه‌ها عوض شود
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() =>
                      setSpecs((prev) => [
                        ...prev,
                        {
                          localId: uid(),
                          specificationId: "",
                          value: "",
                          highlight: false,
                          sortOrder: prev.length,
                        },
                      ])
                    }
                  >
                    <Plus className="h-4 w-4" />
                    مشخصه جدید
                  </Button>
                </div>

                {specs.length === 0 ? (
                  <EmptyBlock
                    icon={<SlidersHorizontal className="h-5 w-5" />}
                    title="مشخصه‌ای ثبت نشده"
                    hint="مشخصه‌هایی مثل NPK، فرمولاسیون و…"
                  />
                ) : (
                  <SortableList
                    items={specs}
                    onReorder={(next) =>
                      setSpecs(next.map((item, index) => ({ ...item, sortOrder: index })))
                    }
                    renderItem={(spec, index, handle) => (
                      <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-bg-elevated)]/55 p-4 transition hover:border-[var(--admin-border-strong)]">
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            {handle}
                            <Badge variant="muted">ردیف {formatFaNumber(index + 1)}</Badge>
                          </div>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            aria-label="حذف مشخصه"
                            onClick={() => void removeSpec(spec)}
                          >
                            <Trash2 className="h-4 w-4 text-[var(--admin-danger)]" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div className="space-y-2 sm:col-span-2">
                            <Label>نوع مشخصه</Label>
                            <AsyncSelect
                              path="/admin/specifications"
                              value={spec.specificationId}
                              selectedLabel={spec.specificationTitle}
                              placeholder="جستجو و انتخاب مشخصه…"
                              searchPlaceholder="نام مشخصه…"
                              mapItem={(item) => ({
                                value: String(item.id),
                                label: String(item.title || item.id),
                                meta: item.position ? String(item.position) : undefined,
                              })}
                              onChange={(id, opt) =>
                                setSpecs((prev) =>
                                  prev.map((s) =>
                                    s.localId === spec.localId
                                      ? {
                                          ...s,
                                          specificationId: id,
                                          specificationTitle: opt?.label,
                                        }
                                      : s
                                  )
                                )
                              }
                            />
                          </div>
                          <div className="space-y-2 sm:col-span-2">
                            <Label>مقدار</Label>
                            <Input
                              value={spec.value}
                              onChange={(e) =>
                                setSpecs((prev) =>
                                  prev.map((s) =>
                                    s.localId === spec.localId
                                      ? { ...s, value: e.target.value }
                                      : s
                                  )
                                )
                              }
                              placeholder="مقدار نمایشی برای این محصول"
                              dir="rtl"
                            />
                          </div>
                          <div className="space-y-2 sm:col-span-2">
                            <Label>برجسته</Label>
                            <div className="flex h-10 items-center justify-between gap-3 rounded-[var(--admin-radius-sm)] border border-[var(--admin-border)] bg-[var(--admin-bg)]/40 px-3">
                              <span className="text-sm text-[var(--admin-muted)]">
                                {spec.highlight ? "فعال" : "غیرفعال"}
                              </span>
                              <Switch
                                checked={spec.highlight}
                                onCheckedChange={(v) =>
                                  setSpecs((prev) =>
                                    prev.map((s) =>
                                      s.localId === spec.localId
                                        ? { ...s, highlight: v }
                                        : s
                                    )
                                  )
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  />
                )}
              </TabsContent>

              <TabsContent value="seo" className="mt-0 space-y-4">
                <SeoFields
                  value={{
                    ...seo,
                    targetPath: seo.targetPath || buildSeoPath("product", form.slug),
                  }}
                  onChange={setSeo}
                />
              </TabsContent>
            </div>
          </Tabs>
        )}

        <DialogFooter className="gap-2 border-t border-[var(--admin-border)] bg-[var(--admin-bg-elevated)]/50 px-6 py-4 sm:justify-end">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
            انصراف
          </Button>
          <Button type="button" disabled={busy || loading} onClick={() => void handleSave()}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            ذخیره محصول
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EmptyBlock({
  icon,
  title,
  hint,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--admin-border)] bg-white/[0.02] px-6 py-12 text-center">
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--admin-accent)]/15 text-[var(--admin-accent)]">
        {icon}
      </div>
      <p className="font-medium">{title}</p>
      <p className="text-sm text-[var(--admin-muted)]">{hint}</p>
    </div>
  );
}
