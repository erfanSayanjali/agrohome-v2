"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { keywordsToArray, type SeoFormValues } from "@/lib/seo";

type SeoFieldsProps = {
  value: SeoFormValues;
  onChange: (next: SeoFormValues) => void;
  /** مسیر هدف معمولاً از اسلاگ ساخته می‌شود؛ در صورت true فقط نمایش داده می‌شود */
  pathReadOnly?: boolean;
  className?: string;
};

export function SeoFields({ value, onChange, pathReadOnly = true, className }: SeoFieldsProps) {
  const [keywordDraft, setKeywordDraft] = useState("");
  const keywords = keywordsToArray(value.metaKeyWords);

  function patch<K extends keyof SeoFormValues>(key: K, next: SeoFormValues[K]) {
    onChange({ ...value, [key]: next });
  }

  function setKeywords(next: string[]) {
    patch("metaKeyWords", next.join("، "));
  }

  function addKeyword() {
    const parts = keywordDraft
      .split(/[,،]/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (!parts.length) return;
    const merged = [...keywords];
    for (const part of parts) {
      if (!merged.some((k) => k === part)) merged.push(part);
    }
    setKeywords(merged);
    setKeywordDraft("");
  }

  function removeKeyword(index: number) {
    setKeywords(keywords.filter((_, i) => i !== index));
  }

  return (
    <div className={className ?? "space-y-4"} dir="rtl">
      <div className="space-y-2">
        <Label htmlFor="seo-metaTitle">عنوان متا</Label>
        <Input
          id="seo-metaTitle"
          value={value.metaTitle}
          onChange={(e) => patch("metaTitle", e.target.value)}
          placeholder="عنوان نمایش‌داده‌شده در نتایج جستجو"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="seo-metaDescription">توضیح متا</Label>
        <Textarea
          id="seo-metaDescription"
          value={value.metaDescription}
          onChange={(e) => patch("metaDescription", e.target.value)}
          placeholder="خلاصه کوتاه برای موتورهای جستجو"
          className="min-h-[100px]"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="seo-metaKeyWords">کلمات کلیدی</Label>
        <div className="flex gap-2">
          <Input
            id="seo-metaKeyWords"
            value={keywordDraft}
            onChange={(e) => setKeywordDraft(e.target.value)}
            placeholder="کلمه کلیدی را بنویسید"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addKeyword();
              }
            }}
          />
          <Button type="button" variant="secondary" onClick={addKeyword}>
            <Plus className="h-4 w-4" />
            افزودن
          </Button>
        </div>
        {keywords.length ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {keywords.map((word, index) => (
              <span
                key={`${word}-${index}`}
                className="inline-flex items-center gap-1 rounded-full border border-[var(--admin-border)] bg-[var(--admin-bg-elevated)] px-2.5 py-1 text-xs"
              >
                {word}
                <button
                  type="button"
                  className="rounded-full p-0.5 text-[var(--admin-muted)] hover:bg-[var(--admin-danger)]/15 hover:text-[var(--admin-danger)]"
                  aria-label={`حذف ${word}`}
                  onClick={() => removeKeyword(index)}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[var(--admin-muted)]">هنوز کلمه‌ای اضافه نشده است</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="seo-canonicalUrl">Canonical</Label>
        <Input
          id="seo-canonicalUrl"
          dir="ltr"
          value={value.canonicalUrl}
          onChange={(e) => patch("canonicalUrl", e.target.value)}
          placeholder="https://example.com/..."
          className="text-start"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="seo-targetPath">مسیر هدف</Label>
        <Input
          id="seo-targetPath"
          dir="ltr"
          value={value.targetPath}
          onChange={(e) => patch("targetPath", e.target.value)}
          readOnly={pathReadOnly}
          className="text-start"
          placeholder="/products/slug"
        />
        {pathReadOnly ? (
          <p className="text-xs text-[var(--admin-muted)]">از روی اسلاگ موجودیت به‌روز می‌شود</p>
        ) : null}
      </div>
    </div>
  );
}
