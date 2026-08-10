"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Rocket, ArrowRight } from "lucide-react";
import { apiDelete, apiGet, apiPost, apiPut, ApiError, unwrap } from "@/lib/api";
import { PageHeader } from "@/components/shell/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionCanvas } from "@/components/cms/section-canvas";
import { PageNavigator, type NavBlock } from "@/components/cms/page-navigator";
import { SectionInspector } from "@/components/cms/section-inspector";
import { SectionLibrary } from "@/components/cms/section-library";
import { SeoFields } from "@/components/seo/seo-fields";
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
  const [selection, setSelection] = useState<Selection | null>(null);
  const [busy, setBusy] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [seo, setSeo] = useState<SeoFormValues>(emptySeoForm());
  const [seoBusy, setSeoBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet<{ content: EditorPage }>(`/admin/pages/${pageId}/editor`);
      const data = unwrap(res);
      setPage(data);
      setSeo(seoRecordToForm(data.seo, buildSeoPath("page", data.slug || "")));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در بارگذاری ادیتور");
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

  if (loading || !page) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="min-h-[36rem] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      <PageHeader
        title={page.title}
        description={`صفحه‌ساز · ${page.slug}`}
        actions={
          <>
            <Badge variant={page.status === "published" ? "success" : "muted"}>
              {page.status}
            </Badge>
            <Button type="button" variant="secondary" onClick={() => router.push("/pages")}>
              <ArrowRight className="h-4 w-4" />
              بازگشت
            </Button>
            <Button type="button" variant="secondary" onClick={() => setLibraryOpen(true)}>
              <Plus className="h-4 w-4" />
              افزودن سکشن
            </Button>
            <Button
              type="button"
              onClick={async () => {
                try {
                  await apiPost(`/admin/pages/${page.id}/publish`);
                  toast.success("صفحه منتشر شد");
                  await load();
                } catch (err) {
                  toast.error(err instanceof ApiError ? err.message : "خطا");
                }
              }}
            >
              <Rocket className="h-4 w-4" />
              Publish
            </Button>
          </>
        }
      />

      <div
        className="grid gap-3 xl:grid-cols-[16rem_minmax(0,1fr)_20rem]"
        style={{ minHeight: "calc(100vh - var(--admin-topbar) - 8rem)" }}
      >
        {/* Navigator */}
        <aside
          className={cn(
            "overflow-hidden rounded-[var(--admin-radius)] border border-[var(--admin-border)] bg-[var(--admin-surface)]/50",
            "xl:sticky xl:top-[calc(var(--admin-topbar)+0.75rem)] xl:z-10 xl:max-h-[calc(100vh-var(--admin-topbar)-1.5rem)]"
          )}
        >
          <PageNavigator
            blocks={navBlocks}
            selection={selection}
            onSelect={setSelection}
            onReorder={handleReorderNav}
            onToggleVisible={(id) => void toggleVisible(id)}
          />
        </aside>

        {/* Canvas */}
        <div className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[var(--admin-radius)] border border-[var(--admin-border)] bg-[#f7f5f1] xl:max-h-[calc(100vh-var(--admin-topbar)-1.5rem)]">
          <div className="flex shrink-0 items-center justify-between border-b border-black/5 bg-white/80 px-4 py-2 text-xs text-[var(--admin-muted)]">
            <span>بوم پیش‌نمایش — روی زیر‌بخش‌ها کلیک کنید</span>
            <span dir="ltr">/{page.slug.replace(/^\//, "")}</span>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto min-h-[28rem] max-w-5xl bg-white text-[#1a1a1a]">
            {sortedBlocks.length === 0 ? (
              <div className="flex min-h-[28rem] flex-col items-center justify-center gap-3 px-6 text-center">
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
        </div>

        {/* Inspector */}
        <aside
          className={cn(
            "overflow-hidden rounded-[var(--admin-radius)] border border-[var(--admin-border)] bg-[var(--admin-surface)]",
            "xl:sticky xl:top-[calc(var(--admin-topbar)+0.75rem)] xl:z-10 xl:max-h-[calc(100vh-var(--admin-topbar)-1.5rem)]"
          )}
        >
          <SectionInspector
            block={selectedBlock}
            selection={selection}
            busy={busy}
            onSave={(patch) => void saveBlock(patch)}
            onDelete={() => void deleteSelected()}
          />
        </aside>
      </div>

      <section className="rounded-[var(--admin-radius)] border border-[var(--admin-border)] bg-[var(--admin-surface)]/40 p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-semibold">SEO</h2>
            <p className="text-sm text-[var(--admin-muted)]">متادیتای صفحه</p>
          </div>
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
        <SeoFields
          value={{
            ...seo,
            targetPath: seo.targetPath || buildSeoPath("page", page.slug),
          }}
          onChange={setSeo}
        />
      </section>

      <SectionLibrary
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        pageId={page.id}
        nextSortOrder={sortedBlocks.length ? Math.max(...sortedBlocks.map((b) => b.sortOrder)) + 1 : 0}
        onInserted={() => void load()}
      />
    </div>
  );
}
