"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Eye, EyeOff, MessageSquareReply } from "lucide-react";
import { apiPost, apiPut, ApiError } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CrudResourcePage } from "@/components/data/crud-resource-page";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

type Row = {
  id: string;
  nickName: string;
  content: string;
  publish: boolean;
  email?: string | null;
  targetType?: string | null;
  productId?: string | null;
  blogId?: string | null;
  product?: { id: string; title?: string } | null;
  blog?: { id: string; title?: string } | null;
};

const targetLabel: Record<string, string> = {
  product: "محصول",
  blog: "مقاله",
  comment: "پاسخ",
};

export default function CommentsPage() {
  const [replyFor, setReplyFor] = useState<Row | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyName, setReplyName] = useState("آگروهوم");
  const [busy, setBusy] = useState(false);

  return (
    <>
      <CrudResourcePage<Row>
        title="نظرات"
        description="نظرات محصول و مقاله در یک مدل؛ پیام‌های فرم تماس جداگانه در «پیام‌های تماس» هستند."
        path="/admin/comments"
        searchPlaceholder="متن یا نام…"
        filters={[
          {
            key: "publish",
            label: "انتشار",
            options: [
              { value: "true", label: "منتشر شده" },
              { value: "false", label: "در انتظار" },
            ],
          },
          {
            key: "targetType",
            label: "نوع",
            options: [
              { value: "product", label: "محصول" },
              { value: "blog", label: "مقاله" },
              { value: "comment", label: "پاسخ" },
            ],
          },
        ]}
        columns={[
          { key: "nick", header: "نام", cell: (r) => r.nickName },
          {
            key: "type",
            header: "نوع",
            cell: (r) => targetLabel[r.targetType || ""] || r.targetType || "—",
          },
          {
            key: "target",
            header: "مرتبط با",
            cell: (r) => {
              if (r.product?.title && r.productId) {
                return (
                  <Link
                    className="text-[var(--admin-accent)] hover:underline"
                    href={`/products`}
                    title={r.product.title}
                  >
                    {r.product.title}
                  </Link>
                );
              }
              if (r.blog?.title) {
                return <span title={r.blog.title}>{r.blog.title}</span>;
              }
              return "—";
            },
          },
          {
            key: "content",
            header: "متن",
            cell: (r) => <span className="line-clamp-2 max-w-md">{r.content}</span>,
          },
          {
            key: "publish",
            header: "وضعیت",
            cell: (r) => (
              <Badge variant={r.publish ? "success" : "danger"}>
                {r.publish ? "منتشر" : "در انتظار"}
              </Badge>
            ),
          },
        ]}
        fields={[
          { name: "nickName", label: "نام", required: true },
          { name: "content", label: "متن", type: "textarea", required: true },
          { name: "email", label: "ایمیل", dir: "ltr" },
          { name: "publish", label: "منتشر", type: "switch" },
          {
            name: "targetType",
            label: "هدف",
            type: "select",
            options: [
              { value: "product", label: "محصول" },
              { value: "blog", label: "وبلاگ" },
              { value: "comment", label: "پاسخ" },
            ],
          },
          {
            name: "productId",
            label: "محصول",
            type: "async-select",
            placeholder: "انتخاب محصول…",
            asyncSelect: {
              path: "/admin/products",
              mapItem: (item) => ({
                value: String(item.id),
                label: String(item.title || item.id),
                meta: item.slug ? String(item.slug) : undefined,
              }),
              allowClear: true,
              searchPlaceholder: "نام محصول…",
            },
          },
          {
            name: "blogId",
            label: "وبلاگ",
            type: "async-select",
            placeholder: "انتخاب مطلب…",
            asyncSelect: {
              path: "/admin/blogs",
              mapItem: (item) => ({
                value: String(item.id),
                label: String(item.title || item.id),
                meta: item.slug ? String(item.slug) : undefined,
              }),
              allowClear: true,
              searchPlaceholder: "عنوان مطلب…",
            },
          },
        ]}
        createDefaults={{ publish: false, targetType: "product" }}
        mapFormToBody={(v) => ({
          ...v,
          publish: v.publish === true || v.publish === "true",
          productId: v.productId || null,
          blogId: v.blogId || null,
        })}
        extraActions={(row, reload) => (
          <>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label={row.publish ? "لغو انتشار" : "انتشار"}
              onClick={async () => {
                try {
                  await apiPut(`/admin/comments/${row.id}`, { publish: !row.publish });
                  toast.success(row.publish ? "لغو انتشار" : "منتشر شد");
                  reload();
                } catch (err) {
                  toast.error(err instanceof ApiError ? err.message : "خطا");
                }
              }}
            >
              {row.publish ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="پاسخ"
              onClick={() => {
                setReplyFor(row);
                setReplyText("");
              }}
            >
              <MessageSquareReply className="h-4 w-4" />
            </Button>
          </>
        )}
      />

      <Dialog open={Boolean(replyFor)} onOpenChange={(o) => !o && setReplyFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>پاسخ به نظر</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>نام پاسخ‌دهنده</Label>
              <Input value={replyName} onChange={(e) => setReplyName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>متن پاسخ</Label>
              <Textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setReplyFor(null)}>
              انصراف
            </Button>
            <Button
              type="button"
              disabled={busy}
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
    </>
  );
}
