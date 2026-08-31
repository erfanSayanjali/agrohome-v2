"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, ArrowRight, Search } from "lucide-react";
import { apiDelete, apiGet, apiPut, ApiError, unwrap } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionCanvas } from "@/components/cms/section-canvas";
import { PageNavigator, type NavBlock } from "@/components/cms/page-navigator";
import { SectionInspector } from "@/components/cms/section-inspector";
import { SectionLibrary } from "@/components/cms/section-library";
import { SeoFields } from "@/components/seo/seo-fields";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  buildSeoPath,
  emptySeoForm,
  seoRecordToForm,
  upsertEntitySeo,
  type SeoFormValues,
  type SeoRecord,
} from "@/lib/seo";
import type { Selection } from "@/lib/cms-blocks";
import { cn } from "@/lib/utils";

type Block = {
  id: string;
  type: string;
  name?: string | null;
  sortOrder: number;
  isVisible: boolean;
  sourceType: string;
  payload: Record<string, unknown>;
  anchor?: string | null;
};

type EditorPage = {
  id: string;
  title: string;
  slug: string;
  status: string;
  blocks: Block[];
  seo?: SeoRecord | null;
};

type PageBuilderShellProps = {
  pageId: string;
};

export function PageBuilderShell({ pageId }: PageBuilderShellProps) {
  const router = useRouter();
  const [page, setPage] = useState<EditorPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [busy, setBusy] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [seoOpen, setSeoOpen] = useState(false);
  const [seo, setSeo] = useState<SeoFormValues>(emptySeoForm());
  const [seoBusy, setSeoBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await apiGet<{ content: EditorPage }>(`/admin/pages/${pageId}/editor`);
      const data = unwrap(res);
      setPage(data);
      setSeo(seoRecordToForm(data.seo, buildSeoPath("page", data.slug || "")));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "خطا در بارگذاری ادیتور";
      setLoadError(message);
      setPage(null);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [pageId]);

  useEffect(() => {
    void load();
  }, [load]);

  const sortedBlocks = useMemo(
    () => [...(page?.blocks || [])].sort((a, b) => a.sortOrder - b.sortOrder),
    [page]
  );

  const selectedBlock = useMemo(
    () => sortedBlocks.find((b) => b.id === selection?.blockId) || null,
    [sortedBlocks, selection]
  );

  const navBlocks: NavBlock[] = useMemo(
    () =>
      sortedBlocks.map((b) => ({
        id: b.id,
        localId: b.id,
        type: b.type,
        name: b.name,
        isVisible: b.isVisible,
        payload: b.payload || {},
      })),
    [sortedBlocks]
  );

  async function persistReorder(blocks: Block[]) {
    await apiPut("/admin/blocks/reorder", {
      items: blocks.map((b, index) => ({ id: b.id, sortOrder: index })),
    });
  }

  async function handleReorderNav(items: NavBlock[]) {
    if (!page) return;
    const withOrder = items.map((item, index) => {
      const full = page.blocks.find((b) => b.id === item.id)!;
      return { ...full, sortOrder: index };
    });
    setPage({ ...page, blocks: withOrder });
    try {
      await persistReorder(withOrder);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در ترتیب");
      await load();
    }
  }

  async function saveBlock(patch: Partial<Block>) {
    if (!selectedBlock || !page) return;
    setBusy(true);
    try {
      const body = {
        type: selectedBlock.type,
        name: patch.name ?? selectedBlock.name,
        isVisible: patch.isVisible ?? selectedBlock.isVisible,
        sourceType: selectedBlock.sourceType,
        payload: patch.payload ?? selectedBlock.payload,
        anchor: patch.anchor !== undefined ? patch.anchor : selectedBlock.anchor,
        sortOrder: selectedBlock.sortOrder,
      };
      await apiPut(`/admin/blocks/${selectedBlock.id}`, body);
      setPage({
        ...page,
        blocks: page.blocks.map((b) =>
          b.id === selectedBlock.id ? { ...b, ...body } : b
        ),
      });
      toast.success("ذخیره شد");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "ذخیره ناموفق");
    } finally {
      setBusy(false);
    }
  }

  async function deleteSelected() {
    if (!selectedBlock || !page) return;
    try {
      await apiDelete(`/admin/blocks/${selectedBlock.id}`);
      setPage({
        ...page,
        blocks: page.blocks.filter((b) => b.id !== selectedBlock.id),
      });
      setSelection(null);
      toast.success("سکشن حذف شد");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "حذف ناموفق");
    }
  }

  async function toggleVisible(blockId: string) {
    if (!page) return;
    const block = page.blocks.find((b) => b.id === blockId);
    if (!block) return;
    const next = !block.isVisible;
    try {
      await apiPut(`/admin/blocks/${blockId}`, {
        type: block.type,
        name: block.name,
        isVisible: next,
        sourceType: block.sourceType,
        payload: block.payload,
        anchor: block.anchor,
        sortOrder: block.sortOrder,
      });
      setPage({
        ...page,
        blocks: page.blocks.map((b) =>
          b.id === blockId ? { ...b, isVisible: next } : b
        ),
      });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا");
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="min-h-[36rem] w-full" />
      </div>
    );
  }

  if (loadError || !page) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12 text-center">
        <p className="text-sm text-[var(--admin-muted)]">
          {loadError || "صفحه یافت نشد"}
        </p>
        <Button type="button" variant="outline" onClick={() => void load()}>
          تلاش مجدد
        </Button>
      </div>
    );
  }

  return (
    <div
      className="flex h-[calc(100vh-var(--admin-topbar))] flex-col overflow-hidden bg-[var(--admin-bg)]"
      dir="rtl"
    >
      {/* Toolbar */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2 text-start">
          <h1 className="truncate text-base font-semibold">{page.title}</h1>
          <Badge variant={page.status === "published" ? "success" : "muted"} className="shrink-0">
            {page.status}
          </Badge>
          <p className="min-w-0 truncate text-xs text-[var(--admin-muted)]" dir="ltr">
            /{page.slug.replace(/^\//, "")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => router.push("/pages")}>
            <ArrowRight className="h-4 w-4" />
            بازگشت
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => setSeoOpen(true)}>
            <Search className="h-4 w-4" />
            SEO
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => setLibraryOpen(true)}>
            <Plus className="h-4 w-4" />
            افزودن سکشن
          </Button>
        </div>
      </div>

      {/* Workspace: navigator | canvas | inspector */}
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-[15.5rem] shrink-0 flex-col border-e border-[var(--admin-border)] bg-[var(--admin-surface)] lg:flex">
          <PageNavigator
            blocks={navBlocks}
            selection={selection}
            onSelect={setSelection}
            onReorder={handleReorderNav}
            onToggleVisible={(id) => void toggleVisible(id)}
          />
        </aside>

        <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#eceae6]">
          <div className="flex shrink-0 items-center justify-between border-b border-black/5 bg-white/70 px-4 py-1.5 text-xs text-[var(--admin-muted)]">
            <span>پیش‌نمایش دسکتاپ — روی المان‌ها کلیک کنید</span>
            <span>عرض کامل</span>
          </div>
          <div className="min-h-0 flex-1 overflow-auto">
            <div className="mx-auto w-full max-w-[1280px] bg-white text-[#1a1a1a] shadow-[0_0_0_1px_rgba(0,0,0,0.04)]">
              {sortedBlocks.length === 0 ? (
                <div className="flex min-h-[32rem] flex-col items-center justify-center gap-3 px-6 text-center">
                  <p className="text-sm text-black/50">صفحه خالی است.</p>
                  <Button type="button" onClick={() => setLibraryOpen(true)}>
                    <Plus className="h-4 w-4" />
                    افزودن از کتابخانه
                  </Button>
                </div>
              ) : (
                sortedBlocks.map((block) => {
                  const active = selection?.blockId === block.id;
                  return (
                    <div
                      key={block.id}
                      className={cn(
                        "group relative border-b border-black/5",
                        !block.isVisible && "opacity-50",
                        active && !selection?.path && "ring-2 ring-inset ring-[var(--admin-accent)]"
                      )}
                    >
                      <div
                        className="cursor-pointer"
                        onClick={() => setSelection({ blockId: block.id, path: null })}
                      >
                        <SectionCanvas
                          block={block}
                          selectedPath={active ? selection?.path ?? null : null}
                          sectionSelected={active && !selection?.path}
                          onSelectPath={(path) =>
                            setSelection({ blockId: block.id, path })
                          }
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>

        <aside className="flex w-[min(100%,22rem)] shrink-0 flex-col border-s border-[var(--admin-border)] bg-[var(--admin-surface)]">
          <SectionInspector
            block={selectedBlock}
            selection={selection}
            busy={busy}
            onSave={(patch) => void saveBlock(patch)}
            onDelete={() => void deleteSelected()}
            onSelectPath={(path) =>
              selectedBlock
                ? setSelection({ blockId: selectedBlock.id, path })
                : undefined
            }
          />
        </aside>
      </div>

      <Dialog open={seoOpen} onOpenChange={setSeoOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto" dir="rtl">
          <DialogHeader className="text-start">
            <DialogTitle>SEO صفحه</DialogTitle>
          </DialogHeader>
          <SeoFields
            value={{
              ...seo,
              targetPath: seo.targetPath || buildSeoPath("page", page.slug),
            }}
            onChange={setSeo}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setSeoOpen(false)}>
              بستن
            </Button>
            <Button
              type="button"
              disabled={seoBusy}
              onClick={async () => {
                setSeoBusy(true);
                try {
                  const targetPath =
                    seo.targetPath.trim() || buildSeoPath("page", page.slug || "");
                  await upsertEntitySeo({
                    targetType: "page",
                    targetId: page.id,
                    targetPath,
                    pageId: page.id,
                    form: { ...seo, targetPath },
                  });
                  toast.success("SEO ذخیره شد");
                  setSeoOpen(false);
                } catch (err) {
                  toast.error(err instanceof ApiError ? err.message : "خطا");
                } finally {
                  setSeoBusy(false);
                }
              }}
            >
              ذخیره SEO
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <SectionLibrary
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        pageId={page.id}
        nextSortOrder={
          sortedBlocks.length ? Math.max(...sortedBlocks.map((b) => b.sortOrder)) + 1 : 0
        }
        onInserted={() => void load()}
      />
    </div>
  );
}
