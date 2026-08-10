"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Search, Upload } from "lucide-react";
import type { ListResponse } from "@agrohome/shared";
import { apiGet, apiRequest, ApiError, unwrap, unwrapList } from "@/lib/api";
import { mediaUrl } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { CardGridSkeleton } from "@/components/ui/skeletons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type MediaItem = {
  id: string;
  url: string;
  name?: string | null;
  alt?: string | null;
  type?: string | null;
  mimeType?: string | null;
};

export function MediaPicker({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (media: MediaItem) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [alt, setAlt] = useState("");

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search, open]);

  useEffect(() => {
    if (!open) return;
    setPage(1);
  }, [debouncedSearch, open]);

  const load = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet<ListResponse<MediaItem>>("/admin/media", {
        page,
        limit: 12,
        sort: "-createdAt",
        search: debouncedSearch || undefined,
      });
      const data = unwrapList(res);
      setRows(data.content);
      setTotal(data.total);
      setTotalPages(data.meta.totalPages);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطا در دریافت رسانه");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [open, page, debouncedSearch]);

  useEffect(() => {
    if (!open) return;
    void load();
  }, [open, load]);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setDebouncedSearch("");
      setPage(1);
      setRows([]);
      setError(null);
      setShowUpload(false);
      setFile(null);
      setAlt("");
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }, [open]);

  async function handleUpload() {
    if (!file) {
      toast.error("فایل را انتخاب کنید");
      return;
    }
    if (!alt.trim()) {
      toast.error("فیلد alt الزامی است");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("alt", alt.trim());
      const res = await apiRequest<{ content: MediaItem }>("/admin/media/upload", {
        method: "POST",
        formData: fd,
      });
      const uploaded = unwrap(res);
      toast.success("آپلود شد");
      setShowUpload(false);
      setFile(null);
      setAlt("");
      if (fileRef.current) fileRef.current.value = "";
      onSelect(uploaded);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "آپلود ناموفق");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto" dir="rtl">
        <DialogHeader className="space-y-3 pe-10 text-start">
          <DialogTitle>انتخاب رسانه</DialogTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={showUpload ? "secondary" : "default"}
              onClick={() => setShowUpload((v) => !v)}
            >
              <Upload className="h-4 w-4" />
              {showUpload ? "بستن آپلود" : "آپلود جدید"}
            </Button>
          </div>
        </DialogHeader>

        {showUpload ? (
          <div className="space-y-3 rounded-[var(--admin-radius)] border border-dashed border-[var(--admin-border)] bg-[var(--admin-bg-elevated)]/40 p-3">
            <div className="space-y-2">
              <Label htmlFor="media-picker-file">فایل</Label>
              <Input
                id="media-picker-file"
                ref={fileRef}
                type="file"
                accept="image/*,video/*,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="media-picker-alt">متن جایگزین (alt)</Label>
              <Input
                id="media-picker-alt"
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                placeholder="توصیف تصویر برای دسترس‌پذیری"
              />
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={uploading}
                onClick={() => {
                  setShowUpload(false);
                  setFile(null);
                  setAlt("");
                  if (fileRef.current) fileRef.current.value = "";
                }}
              >
                انصراف
              </Button>
              <Button type="button" size="sm" disabled={uploading} onClick={() => void handleUpload()}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploading ? "در حال آپلود…" : "آپلود و انتخاب"}
              </Button>
            </div>
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="media-picker-search">جستجو</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-muted)]" />
            <Input
              id="media-picker-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="نام یا alt…"
              className="ps-9"
            />
          </div>
        </div>

        {loading ? (
          <CardGridSkeleton count={8} />
        ) : error ? (
          <p className="py-8 text-center text-sm text-[var(--admin-danger)]">{error}</p>
        ) : rows.length === 0 ? (
          <div className="space-y-3 py-10 text-center">
            <p className="text-sm text-[var(--admin-muted)]">رسانه‌ای یافت نشد.</p>
            {!showUpload ? (
              <Button type="button" size="sm" onClick={() => setShowUpload(true)}>
                <Upload className="h-4 w-4" />
                آپلود رسانه
              </Button>
            ) : null}
          </div>
        ) : (
          <>
            <div className="grid max-h-[52vh] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3 md:grid-cols-4">
              {rows.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="overflow-hidden rounded-[var(--admin-radius-sm)] border border-[var(--admin-border)] text-start transition hover:border-[var(--admin-border-strong)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.2)]"
                  onClick={() => {
                    onSelect(item);
                    onOpenChange(false);
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={mediaUrl(item.url)}
                    alt={item.alt || item.name || ""}
                    className="aspect-square w-full object-cover"
                  />
                  <div className="space-y-0.5 p-2 text-xs">
                    <p className="truncate font-medium">{item.name}</p>
                    <p className="truncate text-[var(--admin-muted)]">{item.alt}</p>
                  </div>
                </button>
              ))}
            </div>
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              onPageChange={setPage}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
