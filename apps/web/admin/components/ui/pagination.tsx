"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatFaNumber } from "@/lib/utils";

type PaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
};

export function Pagination({ page, totalPages, total, onPageChange }: PaginationProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-3 text-sm text-[var(--admin-muted)]">
      <span>
        {totalPages > 1 ? (
          <>
            صفحه {formatFaNumber(page)} از {formatFaNumber(totalPages)} · {formatFaNumber(total)} مورد
          </>
        ) : (
          <>{formatFaNumber(total)} مورد</>
        )}
      </span>
      {totalPages > 1 ? (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="صفحه قبل"
          >
            <ChevronRight className="h-4 w-4" />
            قبل
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label="صفحه بعد"
          >
            بعد
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
