"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Copy, LayoutTemplate, Loader2 } from "lucide-react";
import { apiGet, apiPost, ApiError, unwrap } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BLOCK_TYPES,
  HOME_PAGE_TEMPLATE,
  blockTypeLabel,
  defaultPayloadFor,
  defaultSourceTypeFor,
} from "@/lib/cms-blocks";
import { cn } from "@/lib/utils";

type LibraryBlock = {
  id: string;
  type: string;
  name?: string | null;
  pageTitle?: string;
  pageSlug?: string;
};

type SectionLibraryProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pageId: string;
  nextSortOrder: number;
  onInserted: () => void;
};

export function SectionLibrary({
  open,
  onOpenChange,
  pageId,
  nextSortOrder,
  onInserted,
}: SectionLibraryProps) {
  const [tab, setTab] = useState<"templates" | "pages">("templates");
  const [fromPages, setFromPages] = useState<LibraryBlock[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet<{ content: { fromPages: LibraryBlock[] } }>(
        "/admin/section-library",
        { excludePageId: pageId }
      );
      setFromPages(unwrap(res).fromPages || []);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در بارگذاری کتابخانه");
    } finally {
      setLoading(false);
    }
  }, [pageId]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  async function insertTemplate(type: string) {
    setBusy(type);
    try {
      await apiPost("/admin/blocks", {
        ownerType: "PAGE",
        pageId,
        type,
        name: blockTypeLabel(type),
        sortOrder: nextSortOrder,
        isVisible: true,
        sourceType: defaultSourceTypeFor(type),
        payload: defaultPayloadFor(type),
      });
      toast.success("سکشن اضافه شد");
      onInserted();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "افزودن ناموفق");
    } finally {
      setBusy(null);
    }
  }

  async function insertHomeTemplate() {
    setBusy("home");
    try {
      let order = nextSortOrder;
      for (const tpl of HOME_PAGE_TEMPLATE) {
        await apiPost("/admin/blocks", {
          ownerType: "PAGE",
          pageId,
          ...tpl,
          sortOrder: order++,
        });
      }
      toast.success("قالب صفحه اصلی اضافه شد");
      onInserted();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا");
    } finally {
      setBusy(null);
    }
  }

  async function cloneBlock(sourceBlockId: string) {
    setBusy(sourceBlockId);
    try {
      await apiPost(`/admin/pages/${pageId}/blocks/clone`, { sourceBlockId });
      toast.success("سکشن کپی شد");
      onInserted();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "کپی ناموفق");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-h-[85vh] max-w-2xl overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-[var(--admin-border)] px-5 py-4 text-start">
          <DialogTitle>کتابخانه سکشن</DialogTitle>
        </DialogHeader>
        <div className="flex gap-1 border-b border-[var(--admin-border)] px-4 pt-2">
          <button
            type="button"
            className={cn(
              "rounded-t-md px-3 py-2 text-sm",
              tab === "templates"
                ? "bg-[var(--admin-surface)] font-medium"
                : "text-[var(--admin-muted)]"
            )}
            onClick={() => setTab("templates")}
          >
            قالب‌ها
          </button>
          <button
            type="button"
            className={cn(
              "rounded-t-md px-3 py-2 text-sm",
              tab === "pages"
                ? "bg-[var(--admin-surface)] font-medium"
                : "text-[var(--admin-muted)]"
            )}
            onClick={() => setTab("pages")}
          >
            از صفحات دیگر
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4">
          {tab === "templates" ? (
            <div className="space-y-3">
              <Button
                type="button"
                variant="secondary"
                className="w-full justify-start"
                disabled={busy === "home"}
                onClick={() => void insertHomeTemplate()}
              >
                <LayoutTemplate className="h-4 w-4" />
                افزودن هر ۸ سکشن صفحه اصلی
              </Button>
              <div className="grid gap-2 sm:grid-cols-2">
                {BLOCK_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    disabled={busy === t.value}
                    onClick={() => void insertTemplate(t.value)}
                    className="flex items-center justify-between rounded-[var(--admin-radius-sm)] border border-[var(--admin-border)] bg-[var(--admin-surface)]/50 px-3 py-3 text-start text-sm transition hover:border-[var(--admin-accent)]/40"
                  >
                    <span>{t.label}</span>
                    <Badge variant="muted">{t.sourceType === "STATIC" ? "ثابت" : "داده"}</Badge>
                  </button>
                ))}
              </div>
            </div>
          ) : loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-[var(--admin-muted)]" />
            </div>
          ) : fromPages.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--admin-muted)]">
              سکشن قابل کپی از صفحات دیگر نیست.
            </p>
          ) : (
            <div className="space-y-2">
              {fromPages.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between gap-3 rounded-[var(--admin-radius-sm)] border border-[var(--admin-border)] px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {b.name || blockTypeLabel(b.type)}
                    </p>
                    <p className="truncate text-xs text-[var(--admin-muted)]">
                      {b.pageTitle} · <span dir="ltr">{b.pageSlug}</span>
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={busy === b.id}
                    onClick={() => void cloneBlock(b.id)}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    کپی
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
