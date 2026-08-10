"use client";

import { useState } from "react";
import { ImageIcon, X } from "lucide-react";
import type { MediaRef } from "@agrohome/shared";
import { toMediaRef } from "@agrohome/shared";
import { mediaUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MediaPicker } from "@/components/media/media-picker";

type MediaFieldProps = {
  value?: unknown;
  onChange: (next: MediaRef | null) => void;
  label?: string;
  placeholder?: string;
};

export function MediaField({
  value,
  onChange,
  label = "رسانه",
  placeholder = "URL تصویر",
}: MediaFieldProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const media = toMediaRef(value);
  const preview = mediaUrl(media?.url);

  return (
    <div
      dir="rtl"
      className="space-y-3 rounded-[var(--admin-radius)] border border-[var(--admin-border)] bg-[var(--admin-bg-elevated)]/50 p-3"
    >
      <div className="flex items-center justify-between gap-2">
        <Label>{label}</Label>
        {media ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs"
            onClick={() => onChange(null)}
          >
            <X className="h-3.5 w-3.5" />
            حذف
          </Button>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1 space-y-2">
          <Label className="text-xs text-[var(--admin-muted)]">آدرس</Label>
          <Input
            value={media?.url || ""}
            onChange={(e) => {
              const url = e.target.value.trim();
              if (!url) {
                onChange(null);
                return;
              }
              onChange({ url, alt: media?.alt ?? null });
            }}
            placeholder={placeholder}
            dir="ltr"
          />
        </div>
        <Button type="button" variant="secondary" onClick={() => setPickerOpen(true)}>
          <ImageIcon className="h-4 w-4" />
          انتخاب از رسانه
        </Button>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-[var(--admin-muted)]">متن جایگزین (alt)</Label>
        <Input
          value={media?.alt || ""}
          onChange={(e) => {
            if (!media?.url) return;
            onChange({ url: media.url, alt: e.target.value || null });
          }}
          placeholder="توصیف تصویر"
          disabled={!media?.url}
        />
      </div>

      {preview ? (
        <div className="overflow-hidden rounded-lg border border-[var(--admin-border)] bg-black/20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt={media?.alt || ""}
            className="mx-auto max-h-36 object-contain"
          />
        </div>
      ) : null}

      {pickerOpen ? (
        <MediaPicker
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          onSelect={(m) =>
            onChange({
              url: m.url,
              alt: m.alt || null,
            })
          }
        />
      ) : null}
    </div>
  );
}
