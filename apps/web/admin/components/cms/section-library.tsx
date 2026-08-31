"use client";

import { useState } from "react";
import { toast } from "sonner";
import { LayoutTemplate } from "lucide-react";
import { apiDelete, apiGet, apiPost, ApiError, unwrap } from "@/lib/api";
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
  ABOUT_PAGE_TEMPLATE,
  CONTACT_PAGE_TEMPLATE,
  HOME_PAGE_TEMPLATE,
  blockTypeLabel,
  defaultPayloadFor,
  defaultSourceTypeFor,
} from "@/lib/cms-blocks";

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
  const [busy, setBusy] = useState<string | null>(null);

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

  async function replacePageBlocks() {
    const res = await apiGet<{ content: { blocks?: Array<{ id: string }> } }>(
      `/admin/pages/${pageId}/editor`
    );
    const editor = unwrap(res);
    for (const block of editor.blocks ?? []) {
      await apiDelete(`/admin/blocks/${block.id}`);
    }
  }

  async function insertHomeTemplate() {
    setBusy("home");
    try {
      await replacePageBlocks();
      for (const tpl of HOME_PAGE_TEMPLATE) {
        await apiPost("/admin/blocks", {
          ownerType: "PAGE",
          pageId,
          ...tpl,
        });
      }
      toast.success("قالب صفحه اصلی جایگزین شد");
      onInserted();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا");
    } finally {
      setBusy(null);
    }
  }

  async function insertContactTemplate() {
    setBusy("contact");
    try {
      let order = nextSortOrder;
      for (const tpl of CONTACT_PAGE_TEMPLATE) {
        await apiPost("/admin/blocks", {
          ownerType: "PAGE",
          pageId,
          ...tpl,
          sortOrder: order++,
        });
      }
      toast.success("قالب صفحه تماس اضافه شد");
      onInserted();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا");
    } finally {
      setBusy(null);
    }
  }

  async function insertAboutTemplate() {
    setBusy("about");
    try {
      let order = nextSortOrder;
      for (const tpl of ABOUT_PAGE_TEMPLATE) {
        await apiPost("/admin/blocks", {
          ownerType: "PAGE",
          pageId,
          ...tpl,
          sortOrder: order++,
        });
      }
      toast.success("قالب صفحه درباره ما اضافه شد");
      onInserted();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا");
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

        <div className="max-h-[60vh] overflow-y-auto p-4">
          <div className="space-y-3">
            <Button
              type="button"
              variant="secondary"
              className="w-full justify-start"
              disabled={busy === "home"}
              onClick={() => void insertHomeTemplate()}
            >
              <LayoutTemplate className="h-4 w-4" />
              جایگزینی ۸ سکشن صفحه اصلی
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full justify-start"
              disabled={busy === "contact"}
              onClick={() => void insertContactTemplate()}
            >
              <LayoutTemplate className="h-4 w-4" />
              افزودن سکشن‌های صفحه تماس با ما
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full justify-start"
              disabled={busy === "about"}
              onClick={() => void insertAboutTemplate()}
            >
              <LayoutTemplate className="h-4 w-4" />
              افزودن سکشن‌های صفحه درباره ما
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
