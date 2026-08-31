"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Eye, EyeOff, Home, Loader2, MessageSquareReply, RefreshCw } from "lucide-react";
import { apiGet, apiPost, apiPut, ApiError, unwrapList } from "@/lib/api";
import type { ListResponse } from "@agrohome/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type CommentRow = {
  id: string;
  nickName: string;
  content: string;
  publish: boolean;
  showOnHome?: boolean;
  rating?: number | null;
  email?: string | null;
  createdAt?: string;
  replies?: CommentRow[];
};

type Props = {
  targetType: "product" | "blog";
  entityId: string;
  entityTitle?: string;
};

export function EntityCommentsPanel({ targetType, entityId, entityTitle }: Props) {
  const [rows, setRows] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyFor, setReplyFor] = useState<CommentRow | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyName, setReplyName] = useState("آگروهوم");
  const [busy, setBusy] = useState(false);

  const filterKey = targetType === "product" ? "productId" : "blogId";
  const allHref = `/comments?filters=${encodeURIComponent(
    JSON.stringify({ targetType, [filterKey]: entityId })
  )}`;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet<ListResponse<CommentRow>>("/admin/comments", {
        page: 1,
        limit: 50,
        sort: "-createdAt",
        filters: JSON.stringify({
          targetType,
          [filterKey]: entityId,
          parentId: null,
        }),
      });
      const list = unwrapList(res).content;
      setRows(list);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در بارگذاری نظرات");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [entityId, filterKey, targetType]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium">نظرات {entityTitle ? `«${entityTitle}»` : ""}</p>
          <p className="text-sm text-[var(--admin-muted)]">
            نظرات کاربران برای این {targetType === "product" ? "محصول" : "مقاله"}؛ پس از تایید منتشر می‌شوند.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" variant="secondary" onClick={() => void load()}>
            <RefreshCw className="h-3.5 w-3.5" />
            بروزرسانی
          </Button>
          <Button type="button" size="sm" variant="outline" asChild>
            <Link href={allHref}>همه نظرات مرتبط</Link>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-[var(--admin-muted)]">
          <Loader2 className="h-4 w-4 animate-spin" />
          در حال بارگذاری…
        </div>
      ) : !rows.length ? (
        <div className="rounded-xl border border-dashed border-[var(--admin-border)] px-4 py-10 text-center text-sm text-[var(--admin-muted)]">
          هنوز نظری برای این مورد ثبت نشده است.
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li
              key={row.id}
              className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{row.nickName}</p>
                  {row.email ? (
                    <p className="text-xs text-[var(--admin-muted)]" dir="ltr">
                      {row.email}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant={row.publish ? "success" : "danger"}>
                    {row.publish ? "منتشر" : "در انتظار"}
                  </Badge>
                  {row.showOnHome ? <Badge variant="accent">صفحه اصلی</Badge> : null}
                </div>
              </div>
              <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">{row.content}</p>
              <div className="mt-3 flex flex-wrap items-center gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    try {
                      await apiPut(`/admin/comments/${row.id}`, { publish: !row.publish });
                      toast.success(row.publish ? "لغو انتشار" : "منتشر شد");
                      void load();
                    } catch (err) {
                      toast.error(err instanceof ApiError ? err.message : "خطا");
                    }
                  }}
                >
                  {row.publish ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {row.publish ? "لغو انتشار" : "انتشار"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    try {
                      await apiPut(`/admin/comments/${row.id}`, {
                        showOnHome: !row.showOnHome,
                      });
                      toast.success(
                        row.showOnHome
                          ? "از صفحه اصلی حذف شد"
                          : "در صفحه اصلی نمایش داده می‌شود"
                      );
                      void load();
                    } catch (err) {
                      toast.error(err instanceof ApiError ? err.message : "خطا");
                    }
                  }}
                >
                  <Home className="h-3.5 w-3.5" />
                  {row.showOnHome ? "حذف از صفحه اصلی" : "نمایش در صفحه اصلی"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setReplyFor(row);
                    setReplyText("");
                  }}
                >
                  <MessageSquareReply className="h-3.5 w-3.5" />
                  پاسخ
                </Button>
              </div>
              {row.replies?.length ? (
                <ul className="mt-3 space-y-2 border-r border-[var(--admin-border)] pr-3">
                  {row.replies.map((reply) => (
                    <li key={reply.id} className="rounded-lg bg-[var(--admin-bg)] p-3 text-sm">
                      <p className="font-medium">{reply.nickName}</p>
                      <p className="mt-1 whitespace-pre-wrap">{reply.content}</p>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <Dialog open={Boolean(replyFor)} onOpenChange={(o) => !o && setReplyFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>پاسخ به نظر</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <FormField label="نام پاسخ‌دهنده">
              <Input value={replyName} onChange={(e) => setReplyName(e.target.value)} />
            </FormField>
            <FormField label="متن پاسخ">
              <Textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} />
            </FormField>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setReplyFor(null)}>
              انصراف
            </Button>
            <Button
              type="button"
              disabled={busy || !replyText.trim()}
              onClick={async () => {
                if (!replyFor) return;
                setBusy(true);
                try {
                  await apiPost(`/admin/comments/${replyFor.id}/reply`, {
                    content: replyText,
                    nickName: replyName,
                  });
                  toast.success("پاسخ ثبت شد");
                  setReplyFor(null);
                  void load();
                } catch (err) {
                  toast.error(err instanceof ApiError ? err.message : "خطا");
                } finally {
                  setBusy(false);
                }
              }}
            >
              ارسال پاسخ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
