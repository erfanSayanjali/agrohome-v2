"use client";

import { useEffect, useState } from "react";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AsyncSelect } from "@/components/ui/async-select";
import { mapCategoryOption } from "@/lib/category-option";
import {
  ENTITY_OPTIONS,
  SORT_OPTIONS,
  type EntityType,
} from "@/lib/cms-blocks";

export type EntityQueryDraft = {
  entity: EntityType;
  limit: number;
  sort: string;
  eyebrow: string;
  title: string;
  showAllHref: string;
  parentSlug: string;
  categoryId: string;
  isFeatured: boolean;
  showOnHome: boolean;
  targetType: string;
  variant: string;
};

export function payloadToQueryDraft(
  payload: Record<string, unknown>,
  fallbackEntity: EntityType = "product"
): EntityQueryDraft {
  const raw = payload.entity ? String(payload.entity) : fallbackEntity;
  const entity = (ENTITY_OPTIONS.some((o) => o.value === raw) ? raw : fallbackEntity) as EntityType;
  return {
    entity,
    limit: Number(payload.limit) || 8,
    sort: String(payload.sort || "-createdAt"),
    eyebrow: String(payload.eyebrow || ""),
    title: String(payload.title || ""),
    showAllHref: String(payload.showAllHref || ""),
    parentSlug: String(payload.parentSlug || ""),
    categoryId: String(payload.categoryId || ""),
    isFeatured: Boolean(payload.isFeatured),
    showOnHome:
      payload.showOnHome !== undefined
        ? Boolean(payload.showOnHome)
        : entity === "comment",
    targetType: String(payload.targetType || "product"),
    variant: String(payload.variant || "slider"),
  };
}

export function queryDraftToPayload(
  base: Record<string, unknown>,
  draft: EntityQueryDraft
): Record<string, unknown> {
  const next: Record<string, unknown> = {
    ...base,
    entity: draft.entity,
    limit: draft.limit,
    sort: draft.sort,
    eyebrow: draft.eyebrow || undefined,
    title: draft.title || undefined,
    showAllHref: draft.showAllHref || undefined,
    variant: draft.variant,
  };

  delete next.parentSlug;
  delete next.categoryId;
  delete next.isFeatured;
  delete next.showOnHome;
  delete next.targetType;
  delete next.filters;

  if (draft.entity === "blog_category" && draft.parentSlug) {
    next.parentSlug = draft.parentSlug;
  }
  if (
    (draft.entity === "product" ||
      draft.entity === "blog" ||
      draft.entity === "product_category") &&
    draft.categoryId
  ) {
    next.categoryId = draft.categoryId;
  }
  if (draft.entity === "product" && draft.isFeatured) {
    next.isFeatured = true;
  }
  if (draft.entity === "comment") {
    next.showOnHome = Boolean(draft.showOnHome);
  }
  if (draft.entity === "comment" && draft.targetType && draft.targetType !== "all") {
    next.targetType = draft.targetType;
  }

  if (!draft.showAllHref) {
    if (draft.entity === "product") next.showAllHref = "/products";
    else if (draft.entity === "blog") next.showAllHref = "/blogs";
  }

  return next;
}

type EntityQueryEditorProps = {
  value: EntityQueryDraft;
  onChange: (next: EntityQueryDraft) => void;
};

export function EntityQueryEditor({ value, onChange }: EntityQueryEditorProps) {
  const [categoryLabel, setCategoryLabel] = useState<string | undefined>();

  useEffect(() => {
    setCategoryLabel(undefined);
  }, [value.entity]);

  function patch(partial: Partial<EntityQueryDraft>) {
    onChange({ ...value, ...partial });
  }

  const categoryPath =
    value.entity === "product" || value.entity === "product_category"
      ? "/admin/product-categories"
      : value.entity === "blog"
        ? "/admin/blog-categories"
        : null;

  return (
    <div className="space-y-4 rounded-[var(--admin-radius-sm)] border border-[var(--admin-border)] bg-[var(--admin-bg)]/30 p-3">
      <p className="text-xs font-semibold text-[var(--admin-muted)]">منبع داده اسلایدر</p>

      <FormField label="نوع محتوا">
        <Select
          value={value.entity}
          onValueChange={(v) => {
            const entity = v as EntityType;
            patch({
              entity,
              categoryId: "",
              parentSlug: entity === "blog_category" ? value.parentSlug || "tutorials" : "",
              isFeatured: false,
              showOnHome: entity === "comment",
              targetType: entity === "comment" ? "product" : "all",
              showAllHref:
                entity === "product" ? "/products" : entity === "blog" ? "/blogs" : "",
              variant:
                entity === "blog_category"
                  ? "category_grid"
                  : entity === "comment"
                    ? "comment_slider"
                    : "slider",
            });
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ENTITY_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="تعداد آیتم">
          <Input
            type="number"
            min={1}
            max={50}
            value={value.limit}
            onChange={(e) =>
              patch({ limit: Math.min(50, Math.max(1, Number(e.target.value) || 1)) })
            }
            dir="ltr"
          />
        </FormField>
        <FormField label="مرتب‌سازی">
          <Select value={value.sort} onValueChange={(v) => patch({ sort: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </div>

      <FormField label="عنوان بخش">
        <Input value={value.title} onChange={(e) => patch({ title: e.target.value })} />
      </FormField>
      <FormField label="خط بالای عنوان">
        <Input value={value.eyebrow} onChange={(e) => patch({ eyebrow: e.target.value })} />
      </FormField>
      <FormField label="لینک «مشاهده همه»">
        <Input
          value={value.showAllHref}
          onChange={(e) => patch({ showAllHref: e.target.value })}
          dir="ltr"
          placeholder="/products"
        />
      </FormField>

      {value.entity === "product" ? (
        <FormField label="فقط محصولات ویژه" htmlFor="featured-only">
          <div
            dir="rtl"
            className="flex h-10 items-center justify-between gap-3 rounded-[var(--admin-radius-sm)] border border-[var(--admin-border)] bg-[var(--admin-bg-elevated)] px-3"
          >
            <span className="text-sm text-[var(--admin-muted)]">
              {value.isFeatured ? "فعال" : "غیرفعال"}
            </span>
            <Switch
              id="featured-only"
              checked={value.isFeatured}
              onCheckedChange={(v) => patch({ isFeatured: v })}
            />
          </div>
        </FormField>
      ) : null}

      {categoryPath ? (
        <FormField
          label={
            value.entity === "blog"
              ? "فیلتر دسته وبلاگ"
              : value.entity === "product_category"
                ? "دسته والد"
                : "فیلتر دسته محصول"
          }
        >
          <AsyncSelect
            path={categoryPath}
            value={value.categoryId || undefined}
            selectedLabel={categoryLabel}
            placeholder="همه / بدون فیلتر"
            mapItem={mapCategoryOption}
            allowClear
            onChange={(id, opt) => {
              patch({ categoryId: id });
              setCategoryLabel(opt?.label);
            }}
          />
          {value.categoryId ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs"
              onClick={() => {
                patch({ categoryId: "" });
                setCategoryLabel(undefined);
              }}
            >
              پاک کردن فیلتر دسته
            </Button>
          ) : null}
        </FormField>
      ) : null}

      {value.entity === "blog_category" ? (
        <FormField
          label="اسلاگ دسته والد"
          hint="مثلاً tutorials برای بخش آموزش‌های خانه"
        >
          <Input
            value={value.parentSlug}
            onChange={(e) => patch({ parentSlug: e.target.value })}
            dir="ltr"
            placeholder="tutorials"
          />
        </FormField>
      ) : null}

      {value.entity === "comment" ? (
        <>
          <FormField label="فقط نظرات صفحه اصلی" htmlFor="show-on-home-only">
            <div
              dir="rtl"
              className="flex h-10 items-center justify-between gap-3 rounded-[var(--admin-radius-sm)] border border-[var(--admin-border)] bg-[var(--admin-bg-elevated)] px-3"
            >
              <span className="text-sm text-[var(--admin-muted)]">
                {value.showOnHome ? "فعال" : "غیرفعال"}
              </span>
              <Switch
                id="show-on-home-only"
                checked={value.showOnHome}
                onCheckedChange={(v) => patch({ showOnHome: v })}
              />
            </div>
          </FormField>
          <FormField label="نوع هدف نظر">
            <Select
              value={value.targetType || "all"}
              onValueChange={(v) => patch({ targetType: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="product">محصول</SelectItem>
                <SelectItem value="blog">وبلاگ</SelectItem>
                <SelectItem value="all">همه</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
        </>
      ) : null}
    </div>
  );
}
