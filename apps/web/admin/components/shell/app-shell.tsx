"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Tags,
  FileText,
  MessageSquare,
  ImageIcon,
  Layers,
  Search,
  Users,
  Inbox,
  Box,
  SlidersHorizontal,
  Menu,
  LogOut,
  PanelLeftClose,
  ChevronDown,
  Shield,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/components/providers/auth-provider";
import { useEffect, useMemo, useState } from "react";

type NavLeaf = {
  href: string;
  label: string;
  icon: LucideIcon;
};

type NavGroup = {
  id: string;
  label: string;
  icon: LucideIcon;
  items: NavLeaf[];
};

type NavEntry =
  | { type: "link"; item: NavLeaf }
  | { type: "group"; group: NavGroup };

const navEntries: NavEntry[] = [
  {
    type: "link",
    item: { href: "/", label: "داشبورد", icon: LayoutDashboard },
  },
  {
    type: "group",
    group: {
      id: "products",
      label: "مدیریت محصولات",
      icon: Package,
      items: [
        { href: "/products", label: "محصولات", icon: Package },
        { href: "/product-categories", label: "دسته‌بندی‌ها", icon: FolderTree },
        { href: "/packages", label: "بسته‌ها", icon: Box },
        { href: "/specifications", label: "مشخصه‌ها", icon: SlidersHorizontal },
        { href: "/product-specifications", label: "مشخصات محصول", icon: SlidersHorizontal },
        { href: "/tags", label: "تگ‌ها", icon: Tags },
        { href: "/tag-categories", label: "موضوع تگ", icon: Tags },
        {
          href: '/comments?filters=%7B%22targetType%22%3A%22product%22%7D',
          label: "نظرات محصولات",
          icon: MessageSquare,
        },
      ],
    },
  },
  {
    type: "group",
    group: {
      id: "content",
      label: "محتوا و وبلاگ",
      icon: FileText,
      items: [
        { href: "/blogs", label: "مطالب وبلاگ", icon: FileText },
        { href: "/blog-categories", label: "دسته‌بندی وبلاگ", icon: FolderTree },
        {
          href: '/comments?filters=%7B%22targetType%22%3A%22blog%22%7D',
          label: "نظرات مقالات",
          icon: MessageSquare,
        },
      ],
    },
  },
  {
    type: "group",
    group: {
      id: "messages",
      label: "پیام‌ها و نظرات",
      icon: Inbox,
      items: [
        { href: "/comments", label: "همه نظرات", icon: MessageSquare },
        { href: "/contacts", label: "پیام‌های تماس", icon: Inbox },
      ],
    },
  },
  {
    type: "group",
    group: {
      id: "cms",
      label: "CMS و رسانه",
      icon: Layers,
      items: [
        { href: "/pages", label: "صفحه‌ساز", icon: Layers },
        { href: "/media", label: "کتابخانه رسانه", icon: ImageIcon },
        { href: "/seo", label: "SEO", icon: Search },
      ],
    },
  },
  {
    type: "group",
    group: {
      id: "system",
      label: "کاربران و سیستم",
      icon: Shield,
      items: [
        { href: "/users", label: "کاربران", icon: Users },
        { href: "/roles", label: "نقش‌ها", icon: Shield },
      ],
    },
  },
  {
    type: "link",
    item: { href: "/settings", label: "تنظیمات سایت", icon: Settings },
  },
];

function isPathActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function groupHasActive(pathname: string, group: NavGroup) {
  return group.items.some((item) => isPathActive(pathname, item.href));
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const activeGroupIds = useMemo(
    () =>
      navEntries
        .filter((e): e is Extract<NavEntry, { type: "group" }> => e.type === "group")
        .filter((e) => groupHasActive(pathname, e.group))
        .map((e) => e.group.id),
    [pathname]
  );

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev };
      for (const id of activeGroupIds) next[id] = true;
      return next;
    });
  }, [activeGroupIds]);

  function toggleGroup(id: string) {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  let staggerIndex = 0;

  return (
    <nav className="flex flex-col gap-1.5" aria-label="منوی اصلی">
      {navEntries.map((entry) => {
        if (entry.type === "link") {
          const item = entry.item;
          const active = isPathActive(pathname, item.href);
          const Icon = item.icon;
          const delay = staggerIndex++;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              style={{ animationDelay: `${delay * 55}ms` }}
              className={cn(
                "admin-nav-enter group relative flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                mounted && "admin-nav-enter-active",
                active
                  ? "bg-[var(--admin-accent)] text-[var(--admin-accent-fg)] shadow-[0_8px_24px_rgba(244,193,17,0.22)]"
                  : "text-[var(--admin-muted)] hover:bg-white/[0.06] hover:text-[var(--admin-text)]"
              )}
            >
              <span
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-lg transition-colors",
                  active ? "bg-black/10" : "bg-white/[0.04] group-hover:bg-white/[0.07]"
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span>{item.label}</span>
            </Link>
          );
        }

        const { group } = entry;
        const open = Boolean(openGroups[group.id]);
        const sectionActive = groupHasActive(pathname, group);
        const GroupIcon = group.icon;
        const delay = staggerIndex++;

        return (
          <div
            key={group.id}
            style={{ animationDelay: `${delay * 55}ms` }}
            className={cn(
              "admin-nav-enter rounded-xl",
              mounted && "admin-nav-enter-active",
              sectionActive && !open && "ring-1 ring-[var(--admin-border-strong)]/40"
            )}
          >
            <button
              type="button"
              aria-expanded={open}
              onClick={() => toggleGroup(group.id)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200",
                sectionActive || open
                  ? "bg-white/[0.07] text-[var(--admin-text)]"
                  : "text-[var(--admin-muted)] hover:bg-white/[0.05] hover:text-[var(--admin-text)]"
              )}
            >
              <span
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-lg transition-colors",
                  sectionActive
                    ? "bg-[var(--admin-accent)]/20 text-[var(--admin-accent)]"
                    : "bg-white/[0.04]"
                )}
              >
                <GroupIcon className="h-4 w-4" />
              </span>
              <span className="flex-1 text-start">{group.label}</span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 opacity-70 transition-transform duration-300 ease-out",
                  open && "rotate-180"
                )}
              />
            </button>

            <div
              className={cn(
                "grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              )}
            >
              <div className="overflow-hidden">
                <ul className="relative mt-1 space-y-0.5 pb-1.5">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute start-[1.375rem] top-1 bottom-2 w-px bg-gradient-to-b from-[var(--admin-border-strong)]/55 via-white/15 to-transparent"
                  />
                  {group.items.map((item, itemIndex) => {
                    const active = isPathActive(pathname, item.href);
                    const Icon = item.icon;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={onNavigate}
                          style={
                            open
                              ? { transitionDelay: `${itemIndex * 35}ms` }
                              : undefined
                          }
                          className={cn(
                            "relative flex items-center gap-2.5 rounded-lg py-2 pe-3 ps-10 text-[13px] transition-all duration-200",
                            open ? "translate-x-0 opacity-100" : "translate-x-1 opacity-0",
                            active
                              ? "bg-[var(--admin-accent)]/12 text-[var(--admin-accent)]"
                              : "text-[var(--admin-muted)] hover:bg-white/[0.05] hover:text-[var(--admin-text)]"
                          )}
                        >
                          {/* هم‌تراز با خط عمودی گروه (مرکز روی start 1.375rem) */}
                          <span
                            aria-hidden
                            className={cn(
                              "absolute start-[1.375rem] top-1/2 z-[1] h-4 w-0.5 -translate-y-1/2 rounded-full ms-[-1px] transition-opacity",
                              active
                                ? "bg-[var(--admin-accent)] opacity-100 shadow-[0_0_8px_rgba(244,193,17,0.55)]"
                                : "opacity-0"
                            )}
                          />
                          <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" />
                          <span>{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        );
      })}
    </nav>
  );
}

function SidebarBrand({ animate }: { animate?: boolean }) {
  return (
    <div
      className={cn(
        "mb-6 px-3 pt-1",
        animate && "admin-nav-enter admin-nav-enter-active"
      )}
      style={animate ? { animationDelay: "0ms" } : undefined}
    >
      <p className="text-[1.35rem] font-bold leading-none tracking-tight text-[var(--admin-accent)]">
        آگروهوم
      </p>
      <p className="mt-2 text-[11px] font-medium tracking-wide text-[var(--admin-muted)]">
        پنل مدیریت
      </p>
      <div
        aria-hidden
        className="mt-4 h-px w-10 bg-gradient-to-l from-[var(--admin-accent)]/70 to-transparent"
      />
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const name =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.phone || "ادمین";
  const isPageBuilder = /^\/pages\/[^/]+\/?$/.test(pathname || "");

  return (
    <div className="min-h-screen md:ps-[var(--admin-sidebar)]">
      <aside className="fixed inset-y-0 start-0 z-30 hidden w-[var(--admin-sidebar)] border-e border-[var(--admin-border)] bg-[var(--admin-bg-elevated)]/92 backdrop-blur-xl md:flex md:flex-col">
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 scrollbar-thin">
          <SidebarBrand animate />
          <NavLinks />
        </div>
      </aside>

      <header
        dir="rtl"
        className="sticky top-0 z-20 flex h-[var(--admin-topbar)] items-center justify-between gap-3 border-b border-[var(--admin-border)] bg-[var(--admin-bg)]/80 px-4 backdrop-blur-md"
      >
        <div className="text-start">
          <p className="text-sm font-medium leading-tight">{name}</p>
          <p className="text-xs text-[var(--admin-muted)]">{user?.role?.title || "ادمین"}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 md:hidden">
            <span className="text-sm text-[var(--admin-muted)]">آگروهوم</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(true)}
              aria-label="باز کردن منو"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void logout().then(() => (window.location.href = "/login"))}
          >
            <LogOut className="h-4 w-4" />
            خروج
          </Button>
        </div>
      </header>

      <main
        className={
          isPageBuilder
            ? "w-full max-w-none p-0"
            : "mx-auto w-full max-w-7xl px-4 py-6 md:px-6"
        }
      >
        {children}
      </main>

      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogContent className="start-0 top-0 h-full max-w-[18.5rem] translate-x-0 translate-y-0 overflow-y-auto rounded-none border-e sm:rounded-none rtl:start-auto rtl:end-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PanelLeftClose className="h-4 w-4" />
              منو
            </DialogTitle>
          </DialogHeader>
          <Separator />
          <div className="pt-2">
            <NavLinks onNavigate={() => setMobileOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
