"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Eye, EyeOff, Home, MessageSquareReply } from "lucide-react";
import { apiPost, apiPut, ApiError } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CrudResourcePage } from "@/components/data/crud-resource-page";
import { IconActionButton } from "@/components/ui/icon-action-button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

type Row = {
  id: string;
  nickName: string;
  content: string;
  publish: boolean;
  showOnHome: boolean;
  email?: string | null;
  targetType?: string | null;
  parentId?: string | null;
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
  const [replyFor, setReplyFor] = useState<{ row: Row; reload: () => void } | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyName, setReplyName] = useState("آگروهوم");
  const [busy, setBusy] = useState(false);

  return (
    <>
      <CrudResourcePage<Row>
        title="نظرات"
        description="نظرات ریشه و پاسخ‌ها به‌صورت درختی؛ پیام‌های فرم تماس جداگانه در «پیام‌های تماس» هستند."
        path="/admin/comments"
        nested={{ nestedPath: "/admin/comments-nested", treeColumnKey: "nick" }}
        searchPlaceholder="متن یا نام…"
        disableCreate
        disableEdit
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
            key: "showOnHome",
            label: "صفحه اصلی",
            options: [
              { value: "true", label: "بله" },
              { value: "false", label: "خیر" },
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
          {
            key: "home",
            header: "صفحه اصلی",
            filter: { key: "showOnHome", type: "boolean" },
            cell: (r) =>
              r.showOnHome ? <Badge variant="accent">بله</Badge> : "—",
          },
        ]}
        fields={[]}
        extraActions={(row, reload) => (
          <>
            <IconActionButton
              tooltip={row.publish ? "لغو انتشار" : "انتشار"}
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
            </IconActionButton>
            <IconActionButton
              tooltip={row.showOnHome ? "حذف از صفحه اصلی" : "نمایش در صفحه اصلی"}
              onClick={async () => {
                try {
                  await apiPut(`/admin/comments/${row.id}`, {
                    showOnHome: !row.showOnHome,
                  });
                  toast.success(
                    row.showOnHome ? "از صفحه اصلی حذف شد" : "در صفحه اصلی نمایش داده می‌شود"
                  );
                  reload();
                } catch (err) {
                  toast.error(err instanceof ApiError ? err.message : "خطا");
                }
              }}
            >
              <Home
                className={`h-4 w-4 ${row.showOnHome ? "text-[var(--admin-accent)]" : ""}`}
              />
            </IconActionButton>
            <IconActionButton
              tooltip="پاسخ"
              onClick={() => {
                setReplyFor({ row, reload });
                setReplyText("");
              }}
            >
              <MessageSquareReply className="h-4 w-4" />
            </IconActionButton>
          </>
        )}
      />

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
              disabled={busy}
              onClick={async () => {
                if (!replyFor) return;
                setBusy(true);
                try {
                  await apiPost(`/admin/comments/${replyFor.row.id}/reply`, {
                    content: replyText,
                    nickName: replyName,
                  });
                  toast.success("پاسخ ثبت شد");
                  replyFor.reload();
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
