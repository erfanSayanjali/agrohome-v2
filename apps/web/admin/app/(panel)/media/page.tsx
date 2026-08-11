"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2, Upload } from "lucide-react";
import { apiDelete, apiPut, apiRequest, ApiError } from "@/lib/api";
import { useResourceList } from "@/lib/use-resource-list";
import { PageHeader } from "@/components/shell/page-header";
import { DataToolbar } from "@/components/data/data-toolbar";
import { ConfirmDelete } from "@/components/data/confirm-delete";
import { CardGridSkeleton } from "@/components/ui/skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { MediaItem, MediaUsage } from "@/components/media/media-picker";

const ENTITY_LABELS: Record<MediaUsage["entityType"], string> = {
  product: "محصول",
  blog: "بلاگ",
  blog_category: "دسته بلاگ",
  user: "کاربر",
  site_settings: "تنظیمات",
  cms_block: "بلوک CMS",
};

function usageBadgeText(u: MediaUsage) {
  const type = ENTITY_LABELS[u.entityType] || u.entityType;
  return `${type}: ${u.label}`;
}

export default function MediaPage() {
  const list = useResourceList<MediaItem>("/admin/media");
  const fileRef = useRef<HTMLInputElement>(null);
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [alt, setAlt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [editItem, setEditItem] = useState<MediaItem | null>(null);
  const [editAlt, setEditAlt] = useState("");
  const [editName, setEditName] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!list.hasMore || list.loadingMore) return;
    const node = loadMoreSentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) list.loadMore();
      },
      { root: null, rootMargin: "320px 0px", threshold: 0 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [list.hasMore, list.loadingMore, list.loadMore, list.rows.length]);

  return (
    <div>
      <PageHeader
        title="کتابخانه رسانه"
        description="آپلود با فیلد alt؛ فیلتر بر اساس موجودیت مصرف‌کننده"
        actions={
          <Button type="button" onClick={() => setUploadOpen(true)}>
            <Upload className="h-4 w-4" />
            آپلود
          </Button>
        }
      />

      <DataToolbar
        state={list.state}
        onChange={list.setQuery}
        searchPlaceholder="نام، url یا alt…"
        sortOptions={[
          { value: "-createdAt", label: "جدیدترین" },
          { value: "name", label: "نام" },
        ]}
        filters={[
          {
            key: "usedBy",
            label: "مصرف در",
            options: [
              { value: "product", label: "محصول" },
              { value: "blog", label: "بلاگ" },
              { value: "blog_category", label: "دسته بلاگ" },
              { value: "user", label: "کاربر" },
              { value: "site_settings", label: "تنظیمات سایت" },
              { value: "cms_block", label: "بلوک CMS" },
              { value: "unused", label: "استفاده‌نشده" },
            ],
          },
        ]}
      />

      {list.loading && !list.rows.length ? (
        <CardGridSkeleton />
      ) : list.error && !list.rows.length ? (
        <p className="text-[var(--admin-danger)]">{list.error}</p>
      ) : (
        <>
          {!list.rows.length ? (
            <div className="rounded-[var(--admin-radius)] border border-dashed border-[var(--admin-border)] p-10 text-center">
              هنوز رسانه‌ای نیست.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {list.rows.map((item) => {
                  const usages = item.usages ?? [];
                  const shown = usages.slice(0, 2);
                  const rest = usages.length - shown.length;
                  return (
                    <div
                      key={item.id}
                      className="overflow-hidden rounded-[var(--admin-radius)] border border-[var(--admin-border)] bg-[var(--admin-surface)]/60"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.url}
                        alt={item.alt || item.name || ""}
                        className="aspect-square w-full object-cover"
                      />
                      <div className="space-y-2 p-3">
                        <p className="truncate text-sm font-medium">{item.name}</p>
                        <p className="truncate text-xs text-[var(--admin-muted)]">
                          {item.alt || "بدون alt"}
                        </p>
                        <div className="flex min-h-[1.5rem] flex-wrap gap-1">
                          {usages.length === 0 ? (
                            <Badge variant="muted">استفاده‌نشده</Badge>
                          ) : (
                            <>
                              {shown.map((u) => (
                                <Badge
                                  key={`${u.entityType}-${u.entityId}-${u.field}`}
                                  variant="accent"
                                  title={usageBadgeText(u)}
                                  className="max-w-full truncate"
                                >
                                  {usageBadgeText(u)}
                                </Badge>
                              ))}
                              {rest > 0 ? (
                                <Badge variant="muted">+{rest}</Badge>
                              ) : null}
                            </>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            aria-label="ویرایش"
                            onClick={() => {
                              setEditItem(item);
                              setEditAlt(item.alt || "");
                              setEditName(item.name || "");
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            aria-label="حذف"
                            onClick={() => setDeleteId(item.id)}
                          >
                            <Trash2 className="h-4 w-4 text-[var(--admin-danger)]" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {list.hasMore || list.loadingMore ? (
                <div ref={loadMoreSentinelRef} className="mt-4">
                  <CardGridSkeleton count={4} />
                </div>
              ) : null}
            </>
          )}
          <Pagination
            page={list.meta.page}
            totalPages={list.meta.totalPages}
            total={list.total}
            onPageChange={(page) => list.setQuery({ page })}
            mode={list.paginationMode}
            loadingMore={list.loadingMore}
            hasMore={list.hasMore}
            onLoadMore={list.loadMore}
            loadedCount={list.rows.length}
            observeSentinel={false}
          />
        </>
      )}

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent dir="rtl" className="max-w-lg">
          <DialogHeader className="text-start">
            <DialogTitle>آپلود رسانه</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="media-file">فایل</Label>
              <Input
                id="media-file"
                ref={fileRef}
                type="file"
                accept="image/*,video/*,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="media-alt">متن جایگزین (alt)</Label>
              <Input
                id="media-alt"
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                placeholder="توصیف تصویر برای دسترس‌پذیری"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setUploadOpen(false)}>
              انصراف
            </Button>
            <Button
              type="button"
              disabled={busy}
              onClick={async () => {
                if (!file) {
                  toast.error("فایل را انتخاب کنید");
                  return;
                }
                if (!alt.trim()) {
                  toast.error("فیلد alt الزامی است");
                  return;
                }
                setBusy(true);
                try {
                  const fd = new FormData();
                  fd.append("file", file);
                  fd.append("alt", alt.trim());
                  await apiRequest("/admin/media/upload", { method: "POST", formData: fd });
                  toast.success("آپلود شد");
                  setUploadOpen(false);
                  setFile(null);
                  setAlt("");
                  list.reload();
                } catch (err) {
                  toast.error(err instanceof ApiError ? err.message : "آپلود ناموفق");
                } finally {
                  setBusy(false);
                }
              }}
            >
              آپلود
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editItem)} onOpenChange={(o) => !o && setEditItem(null)}>
        <DialogContent dir="rtl" className="max-w-lg">
          <DialogHeader className="text-start">
            <DialogTitle>ویرایش رسانه</DialogTitle>
          </DialogHeader>
          {editItem ? (
            <div className="space-y-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={editItem.url}
                alt={editAlt || editName}
                className="mx-auto max-h-48 rounded-md object-contain"
              />
              <div className="space-y-2">
                <Label>نام</Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>alt</Label>
                <Input value={editAlt} onChange={(e) => setEditAlt(e.target.value)} />
              </div>
              {editItem.usages?.length ? (
                <div className="space-y-1.5">
                  <Label>مصرف در</Label>
                  <div className="flex flex-wrap gap-1">
                    {editItem.usages.map((u) => (
                      <Badge
                        key={`${u.entityType}-${u.entityId}-${u.field}`}
                        variant="accent"
                      >
                        {usageBadgeText(u)}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[var(--admin-muted)]">در هیچ موجودیتی استفاده نشده</p>
              )}
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setEditItem(null)}>
              انصراف
            </Button>
            <Button
              type="button"
              onClick={async () => {
                if (!editItem) return;
                try {
                  await apiPut(`/admin/media/${editItem.id}`, {
                    name: editName,
                    alt: editAlt,
                  });
                  toast.success("ذخیره شد");
                  setEditItem(null);
                  list.reload();
                } catch (err) {
                  toast.error(err instanceof ApiError ? err.message : "خطا");
                }
              }}
            >
              ذخیره
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDelete
        open={Boolean(deleteId)}
        onOpenChange={(v) => !v && setDeleteId(null)}
        onConfirm={async () => {
          if (!deleteId) return;
          await apiDelete(`/admin/media/${deleteId}`);
          list.reload();
        }}
      />
    </div>
  );
}
