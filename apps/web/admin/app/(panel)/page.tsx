"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet, unwrap } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatsSkeleton } from "@/components/ui/skeletons";
import { formatFaNumber } from "@/lib/utils";

type Stats = {
  products: number;
  blogs: number;
  commentsPending: number;
  contactsNew: number;
  pages: number;
  media: number;
  users: number;
  categories: number;
};

const cards: Array<{ key: keyof Stats; label: string; href: string }> = [
  { key: "products", label: "محصولات", href: "/products" },
  { key: "blogs", label: "وبلاگ", href: "/blogs" },
  { key: "commentsPending", label: "نظرات در انتظار", href: "/comments?filters=%7B%22publish%22%3Afalse%7D" },
  { key: "contactsNew", label: "پیام‌های جدید", href: "/contacts?filters=%7B%22status%22%3A%22new%22%7D" },
  { key: "pages", label: "صفحات CMS", href: "/pages" },
  { key: "media", label: "رسانه", href: "/media" },
  { key: "users", label: "کاربران", href: "/users" },
  { key: "categories", label: "دسته‌ها", href: "/product-categories" },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<{ content: Stats }>("/admin/stats")
      .then((res) => setStats(unwrap(res)))
      .catch((err) => setError(err instanceof Error ? err.message : "خطا"));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">داشبورد</h1>
        <p className="text-sm text-[var(--admin-muted)]">نمای کلی شمارنده‌ها از endpoint سبک آمار</p>
      </div>

      {error ? (
        <p className="text-[var(--admin-danger)]">{error}</p>
      ) : !stats ? (
        <StatsSkeleton count={8} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <Link key={card.key} href={card.href} className="block transition hover:-translate-y-0.5">
              <Card className="h-full">
                <CardHeader className="pb-2">
                  <CardDescription>{card.label}</CardDescription>
                  <CardTitle className="text-3xl tabular-nums">{formatFaNumber(stats[card.key])}</CardTitle>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>میان‌برها</CardTitle>
          <CardDescription>دسترسی سریع به بخش‌های پرکاربرد</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="secondary">
            <Link href="/pages">صفحه‌ساز</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/products">محصولات</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/media">کتابخانه رسانه</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/comments">نظرات</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
