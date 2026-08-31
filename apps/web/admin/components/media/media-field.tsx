"use client";

import { useState } from "react";
import { ImageIcon, X } from "lucide-react";
import type { MediaRef } from "@agrohome/shared";
import { toMediaRef } from "@agrohome/shared";
import { mediaUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { MediaPicker } from "@/components/media/media-picker";

type MediaFieldProps = {
  value?: unknown;
  onChange: (next: MediaRef | null) => void;
  label?: string;
};

export function MediaField({
  value,
  onChange,
  label = "رسانه",
}: MediaFieldProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const media = toMediaRef(value);
  const preview = mediaUrl(media?.url);

  return (
    <div
      dir="rtl"
      className="space-y-3 rounded-[var(--admin-radius)] border border-[var(--admin-border)] bg-[var(--admin-bg-elevated)] p-3"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-right text-sm font-medium">{label}</p>
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

      {preview ? (
        <div className="overflow-hidden rounded-lg border border-[var(--admin-border)] bg-black/20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt={media?.alt || ""}
            className="mx-auto max-h-36 object-contain"
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--admin-border)] bg-[var(--admin-bg-elevated)] px-4 py-8 text-[var(--admin-muted)] transition hover:border-[var(--admin-accent)] hover:text-[var(--admin-text)]"
        >
          <ImageIcon className="h-8 w-8 opacity-70" />
          <span className="text-sm font-medium">انتخاب از رسانه</span>
        </button>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={() => setPickerOpen(true)}>
          <ImageIcon className="h-4 w-4" />
          {media ? "تغییر تصویر" : "انتخاب از رسانه"}
        </Button>
      </div>

      <FormField label="متن جایگزین (alt)">
        <Input
          value={media?.alt || ""}
          onChange={(e) => {
            if (!media?.url) return;
            onChange({ url: media.url, alt: e.target.value || null });
          }}
          placeholder="توصیف تصویر"
          disabled={!media?.url}
        />
      </FormField>

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
