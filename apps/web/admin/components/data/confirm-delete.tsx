"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ApiError } from "@/lib/api";

type ConfirmDeleteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  onConfirm: () => Promise<void>;
};

export function ConfirmDelete({
  open,
  onOpenChange,
  title = "حذف مورد",
  description = "این عملیات قابل بازگشت نیست. مطمئن هستید؟",
  onConfirm,
}: ConfirmDeleteProps) {
  const [busy, setBusy] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-md">
        <DialogHeader className="text-start">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-end">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            انصراف
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onConfirm();
                toast.success("حذف شد");
                onOpenChange(false);
              } catch (err) {
                toast.error(err instanceof ApiError ? err.message : "حذف ناموفق بود");
              } finally {
                setBusy(false);
              }
            }}
          >
            حذف
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
