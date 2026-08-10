"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ImageIcon, Plus, Pencil, Trash2, ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import { apiDelete, apiPost, apiPut, ApiError } from "@/lib/api";
import { useResourceList } from "@/lib/use-resource-list";
import { useNestedResourceList } from "@/lib/use-nested-resource-list";
import { collectDescendantIds, findInTree } from "@/lib/tree";
import { PageHeader } from "@/components/shell/page-header";
import { DataToolbar, type FilterDef, type SortOption } from "@/components/data/data-toolbar";
import { DataTable, type Column } from "@/components/data/data-table";
import { TreeTitle } from "@/components/data/tree-title";
import { buildFilterMeta, enrichColumnsWithFilters } from "@/lib/enrich-column-filters";
import { ConfirmDelete } from "@/components/data/confirm-delete";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { AsyncSelect, type AsyncSelectOption } from "@/components/ui/async-select";
import { MediaPicker } from "@/components/media/media-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SeoFields } from "@/components/seo/seo-fields";
import {
  buildSeoPath,
  emptySeoForm,
  fetchSeoByTarget,
  seoRecordToForm,
  upsertEntitySeo,
  type SeoFormValues,
  type SeoTargetType,
} from "@/lib/seo";
import { cn } from "@/lib/utils";

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "switch"
  | "select"
  | "combobox"
  | "media"
  | "async-select";

export type AsyncSelectFieldConfig = {
  path: string;
  mapItem: (item: Record<string, unknown>) => AsyncSelectOption;
  sort?: string;
  limit?: number;
  placeholder?: string;
  searchPlaceholder?: string;
  allowClear?: boolean;
  filters?: Record<string, unknown>;
  /** هنگام ویرایش، خود رکورد و فرزندانش از لیست والد حذف شوند */
  excludeSelfTree?: boolean;
  /** کلید لیبل کمکی در values (پیش‌فرض: `${name}Label`) */
  labelKey?: string;
};

export type FormField = {
  name: string;
  label: string;
  type?: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: ComboboxOption[];
  /** فقط برای مقدارهای کدی مثل slug/url/id — لیبل و فرم RTL می‌مانند */
  dir?: "ltr" | "rtl";
  /** عرض در گرید مودال: 1 ستون، 2 ستون، یا تمام عرض */
  colSpan?: 1 | 2 | "full";
  asyncSelect?: AsyncSelectFieldConfig;
};

export type SeoTargetConfig = {
  type: SeoTargetType;
  /** اگر صفحه CMS باشد، رابطه pageId ست می‌شود */
  linkPageId?: boolean;
};

export type NestedConfig = {
  nestedPath: string;
  /** ستونی که تورفتگی درختی می‌گیرد — پیش‌فرض title */
  treeColumnKey?: string;
};

type CrudResourcePageProps<T extends { id: string }> = {
  title: string;
  description?: string;
  path: string;
  columns: Column<T>[];
  fields: FormField[];
  mapRowToForm?: (row: T) => Record<string, unknown>;
  mapFormToBody?: (values: Record<string, unknown>, mode: "create" | "edit") => Record<string, unknown>;
  sortOptions?: SortOption[];
  filters?: FilterDef[];
  searchPlaceholder?: string;
  extraActions?: (row: T, reload: () => void) => React.ReactNode;
  createDefaults?: Record<string, unknown>;
  disableCreate?: boolean;
  disableEdit?: boolean;
  disableDelete?: boolean;
  /** تب SEO برای موجودیت‌هایی که صفحه عمومی دارند */
  seoTarget?: SeoTargetConfig;
  /** درگ‌ودراپ ردیف‌ها به‌جای فیلد عددی sortOrder */
  sortable?: boolean;
  /** نمایش درختی برای موجودیت‌های parent/child */
  nested?: NestedConfig;
};

function resolveColSpan(field: FormField): 1 | 2 | "full" {
  if (field.colSpan) return field.colSpan;
  const type = field.type || "text";
  if (type === "textarea" || type === "media" || type === "async-select") return "full";
  if (type === "switch") return 1;
  return 1;
}

function isFieldRequired(field: FormField) {
  if (field.name === "slug") return true;
  return Boolean(field.required);
}

function isLtrValueField(field: FormField) {
  if (field.dir === "ltr") return true;
  if (field.dir === "rtl") return false;
  if (field.type === "async-select") return false;
  const name = field.name.toLowerCase();
  return (
    name === "slug" ||
    name.endsWith("url") ||
    name.endsWith("id") ||
    name === "email" ||
    name === "phone" ||
    name === "canonicalurl" ||
    name === "targetpath" ||
    name === "permissionsjson" ||
    name.includes("json")
  );
}

function FieldControl({
  field,
  value,
  onChange,
  selectedLabel,
  excludeValues,
}: {
  field: FormField;
  value: unknown;
  onChange: (v: unknown, option?: AsyncSelectOption) => void;
  selectedLabel?: string;
  excludeValues?: string[];
}) {
  const type = field.type || "text";
  const [pickerOpen, setPickerOpen] = useState(false);
  const inputDir: "ltr" | "rtl" = isLtrValueField(field) ? "ltr" : "rtl";

  if (type === "textarea") {
    return (
      <Textarea
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        dir={inputDir}
        className="min-h-[120px]"
      />
    );
  }
  if (type === "number") {
    return (
      <Input
        type="number"
        value={value === undefined || value === null ? "" : String(value)}
        onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        dir={field.dir === "rtl" ? "rtl" : "ltr"}
      />
    );
  }
  if (type === "switch") {
    return (
      <div
        dir="rtl"
        className="flex h-10 items-center justify-between gap-3 rounded-[var(--admin-radius-sm)] border border-[var(--admin-border)] bg-[var(--admin-bg-elevated)] px-3"
      >
        <span className="text-sm text-[var(--admin-muted)]">
          {Boolean(value) ? "فعال" : "غیرفعال"}
        </span>
        <Switch checked={Boolean(value)} onCheckedChange={(checked) => onChange(checked)} />
      </div>
    );
  }
  if (type === "select") {
    return (
      <Select value={String(value ?? "")} onValueChange={onChange} dir="rtl">
        <SelectTrigger dir="rtl" className="text-start">
          <SelectValue placeholder={field.placeholder || "انتخاب"} />
        </SelectTrigger>
        <SelectContent dir="rtl">
          {(field.options || []).map((opt) => (
            <SelectItem key={opt.value} value={opt.value} className="text-start">
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
  if (type === "combobox") {
    return (
      <Combobox
        options={field.options || []}
        value={String(value ?? "")}
        onChange={onChange}
        placeholder={field.placeholder}
        allowClear={!isFieldRequired(field)}
      />
    );
  }
  if (type === "async-select" && field.asyncSelect) {
    const cfg = field.asyncSelect;
    return (
      <AsyncSelect
        path={cfg.path}
        value={value ? String(value) : undefined}
        selectedLabel={selectedLabel}
        placeholder={cfg.placeholder || field.placeholder || "جستجو و انتخاب…"}
        searchPlaceholder={cfg.searchPlaceholder || "جستجو…"}
        mapItem={cfg.mapItem}
        sort={cfg.sort}
        limit={cfg.limit}
        filters={cfg.filters}
        allowClear={cfg.allowClear ?? !isFieldRequired(field)}
        excludeValues={excludeValues}
        onChange={(id, opt) => onChange(id, opt)}
      />
    );
  }
  if (type === "media") {
    const media =
      value && typeof value === "object" && !Array.isArray(value)
        ? (value as { url?: string; alt?: string | null })
        : typeof value === "string" && value
          ? { url: value, alt: null }
          : null;
    const url = media?.url || "";
    return (
      <div
        dir="rtl"
        className="space-y-3 rounded-[var(--admin-radius)] border border-[var(--admin-border)] bg-[var(--admin-bg-elevated)]/50 p-3"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1 space-y-2">
            <Label>آدرس رسانه</Label>
            <Input
              value={url}
              onChange={(e) => {
                const nextUrl = e.target.value.trim();
                onChange(nextUrl ? { url: nextUrl, alt: media?.alt ?? null } : null);
              }}
              placeholder={field.placeholder || "URL یا از کتابخانه انتخاب کنید"}
              dir="ltr"
            />
          </div>
          <Button type="button" variant="secondary" onClick={() => setPickerOpen(true)}>
            <ImageIcon className="h-4 w-4" />
            انتخاب از رسانه
          </Button>
        </div>
        <div className="space-y-2">
          <Label>متن جایگزین (alt)</Label>
          <Input
            value={media?.alt || ""}
            onChange={(e) => {
              if (!url) return;
              onChange({ url, alt: e.target.value || null });
            }}
            placeholder="توصیف تصویر"
            disabled={!url}
          />
        </div>
        {url ? (
          <div className="overflow-hidden rounded-lg border border-[var(--admin-border)] bg-black/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={media?.alt || ""} className="mx-auto max-h-36 object-contain" />
          </div>
        ) : null}
        {pickerOpen ? (
          <MediaPicker
            open={pickerOpen}
            onOpenChange={setPickerOpen}
            onSelect={(m) => onChange({ url: m.url, alt: m.alt || null })}
          />
        ) : null}
      </div>
    );
  }
  return (
    <Input
      value={String(value ?? "")}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
      dir={inputDir}
    />
  );
}

function FormFieldsGrid({
  fields,
  values,
  setValues,
  currentId,
  nestedTree,
  seoTarget,
  setSeo,
}: {
  fields: FormField[];
  values: Record<string, unknown>;
  setValues: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
  currentId?: string | null;
  nestedTree?: ReturnType<typeof useNestedResourceList>["tree"];
  seoTarget?: SeoTargetConfig;
  setSeo?: React.Dispatch<React.SetStateAction<SeoFormValues>>;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 py-1 sm:grid-cols-2">
      {fields.map((field) => {
        const span = resolveColSpan(field);
        const labelKey = field.asyncSelect?.labelKey || `${field.name}Label`;
        let excludeValues: string[] | undefined;
        if (field.asyncSelect?.excludeSelfTree && currentId) {
          excludeValues = [currentId];
          if (nestedTree) {
            const node = findInTree(nestedTree, currentId);
            if (node) excludeValues = [currentId, ...collectDescendantIds(node)];
          }
        }
        return (
          <div
            key={field.name}
            className={cn(
              "space-y-2",
              span === "full" && "sm:col-span-2",
              span === 2 && "sm:col-span-2"
            )}
          >
            <Label htmlFor={field.name} className="flex items-center gap-1">
              <span>{field.label}</span>
              {isFieldRequired(field) ? (
                <span className="text-[var(--admin-danger)]" aria-hidden>
                  *
                </span>
              ) : null}
            </Label>
            <FieldControl
              field={field}
              value={values[field.name]}
              selectedLabel={
                values[labelKey] != null && String(values[labelKey])
                  ? String(values[labelKey])
                  : undefined
              }
              excludeValues={excludeValues}
              onChange={(v, opt) => {
                setValues((prev) => {
                  const next = { ...prev, [field.name]: v };
                  if (field.type === "async-select") {
                    next[labelKey] = opt?.label ?? (v ? prev[labelKey] : "");
                  }
                  if (field.name === "slug" && seoTarget && setSeo) {
                    setSeo((s) => ({
                      ...s,
                      targetPath: buildSeoPath(seoTarget.type, String(v ?? "")),
                    }));
                  }
                  return next;
                });
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

export function CrudResourcePage<T extends { id: string }>({
  title,
  description,
  path,
  columns,
  fields,
  mapRowToForm,
  mapFormToBody,
  sortOptions,
  filters,
  searchPlaceholder,
  extraActions,
  createDefaults,
  disableCreate,
  disableEdit,
  disableDelete,
  seoTarget,
  sortable = false,
  nested,
}: CrudResourcePageProps<T>) {
  const isNested = Boolean(nested?.nestedPath);
  const flatList = useResourceList<T>(
    isNested ? "" : path,
    sortable && !isNested ? { sort: "sortOrder" } : undefined
  );
  const nestedList = useNestedResourceList<T>(nested?.nestedPath, { enabled: isNested });

  const list = isNested
    ? {
        state: nestedList.state,
        setQuery: nestedList.setQuery,
        rows: nestedList.rows as T[],
        total: nestedList.total,
        meta: nestedList.meta,
        loading: nestedList.loading,
        error: nestedList.error,
        reload: nestedList.reload,
      }
    : flatList;

  const effectiveSortable = sortable && !isNested;

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [current, setCurrent] = useState<T | null>(null);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [seo, setSeo] = useState<SeoFormValues>(emptySeoForm());
  const [formTab, setFormTab] = useState("info");
  const [busy, setBusy] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const normalizedFields = fields
    .filter((f) => !(effectiveSortable && f.name === "sortOrder"))
    .map((f) => (f.name === "slug" ? { ...f, required: true } : f));

  function resolveTargetPath(formValues: Record<string, unknown>) {
    if (!seoTarget) return "";
    return buildSeoPath(seoTarget.type, String(formValues.slug ?? ""));
  }

  async function loadSeoForRow(row: T, formValues: Record<string, unknown>) {
    if (!seoTarget) return;
    const fallback = resolveTargetPath(formValues);
    try {
      const record = await fetchSeoByTarget(
        seoTarget.linkPageId
          ? { pageId: row.id, targetType: seoTarget.type, targetId: row.id }
          : { targetType: seoTarget.type, targetId: row.id }
      );
      setSeo(seoRecordToForm(record, fallback));
    } catch {
      setSeo(emptySeoForm({ targetPath: fallback }));
    }
  }

  function enrichParentLabels(formValues: Record<string, unknown>) {
    const next = { ...formValues };
    for (const field of normalizedFields) {
      if (field.type !== "async-select") continue;
      const labelKey = field.asyncSelect?.labelKey || `${field.name}Label`;
      if (next[labelKey]) continue;
      const id = next[field.name];
      if (!id || !isNested) continue;
      const node = nestedList.byId.get(String(id));
      if (node && "title" in node && node.title) {
        next[labelKey] = String(node.title);
      }
    }
    return next;
  }

  function openCreate() {
    setMode("create");
    setCurrent(null);
    const defaults = { ...(createDefaults || {}) };
    setValues(defaults);
    setSeo(emptySeoForm({ targetPath: resolveTargetPath(defaults) }));
    setFormTab("info");
    setOpen(true);
  }

  function openEdit(row: T) {
    setMode("edit");
    setCurrent(row);
    const formValues = enrichParentLabels(
      mapRowToForm ? mapRowToForm(row) : { ...(row as unknown as Record<string, unknown>) }
    );
    setValues(formValues);
    setSeo(emptySeoForm({ targetPath: resolveTargetPath(formValues) }));
    setFormTab("info");
    setOpen(true);
    void loadSeoForRow(row, formValues);
  }

  const actionCol: Column<T> = {
    key: "actions",
    header: "عملیات",
    className: "w-0",
    filter: false,
    cell: (row) => (
      <div className="inline-flex flex-nowrap items-center gap-0.5">
        {extraActions?.(row, list.reload)}
        {!disableEdit ? (
          <Button type="button" size="icon" variant="ghost" onClick={() => openEdit(row)} aria-label="ویرایش">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : null}
        {!disableDelete ? (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => setDeleteId(row.id)}
            aria-label="حذف"
          >
            <Trash2 className="h-4 w-4 text-[var(--admin-danger)]" />
          </Button>
        ) : null}
      </div>
    ),
  };

  const treeColumns = useMemo((): Column<T>[] => {
    if (!isNested || !nested) return columns;
    const key = nested.treeColumnKey || "title";
    return columns.map((col) => {
      if (col.key !== key) return col;
      return {
        ...col,
        cell: (row: T) => {
          const depth = Number((row as { __depth?: number }).__depth ?? 0);
          const hasChildren = Boolean((row as { __hasChildren?: boolean }).__hasChildren);
          const childCount = Number((row as { __childCount?: number }).__childCount ?? 0);
          return (
            <TreeTitle
              depth={depth}
              hasChildren={hasChildren}
              expanded={nestedList.expanded.has(row.id)}
              childCount={childCount}
              onToggle={() => nestedList.toggle(row.id)}
            >
              {col.cell(row)}
            </TreeTitle>
          );
        },
      };
    });
  }, [columns, isNested, nested, nestedList.expanded, nestedList.toggle]);

  const tableColumns = enrichColumnsWithFilters(
    [...treeColumns, actionCol],
    normalizedFields,
    filters || []
  );
  const filterMeta = buildFilterMeta(tableColumns);

  return (
    <div dir="rtl">
      <PageHeader
        title={title}
        description={description}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {isNested ? (
              <>
                <Button type="button" variant="outline" size="sm" onClick={nestedList.expandAll}>
                  <ChevronsUpDown className="h-4 w-4" />
                  باز کردن همه
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={nestedList.collapseAll}>
                  <ChevronsDownUp className="h-4 w-4" />
                  بستن همه
                </Button>
              </>
            ) : null}
            {!disableCreate ? (
              <Button type="button" onClick={openCreate}>
                <Plus className="h-4 w-4" />
                مورد جدید
              </Button>
            ) : null}
          </div>
        }
      />

      <DataToolbar
        state={list.state}
        onChange={list.setQuery}
        searchPlaceholder={searchPlaceholder}
        sortOptions={
          isNested
            ? undefined
            : effectiveSortable
              ? [
                  { value: "sortOrder", label: "ترتیب دستی" },
                  ...(sortOptions || []).filter((o) => o.value !== "sortOrder"),
                ]
              : sortOptions
        }
        filterMeta={filterMeta}
      />

      <DataTable
        columns={tableColumns}
        rows={list.rows}
        loading={list.loading}
        error={list.error}
        page={list.meta.page}
        totalPages={list.meta.totalPages}
        total={list.total}
        onPageChange={(page) => list.setQuery({ page })}
        onRetry={list.reload}
        rowKey={(row) => row.id}
        filters={list.state.filters}
        onFiltersChange={(next) => list.setQuery({ filters: next }, { resetPage: true })}
        sortable={effectiveSortable}
        onReorder={
          effectiveSortable
            ? async (ordered) => {
                const base = (list.state.page - 1) * list.state.limit;
                try {
                  await apiPut(`${path}/reorder`, {
                    items: ordered.map((row, index) => ({
                      id: row.id,
                      sortOrder: base + index,
                    })),
                  });
                  toast.success("ترتیب ذخیره شد");
                  list.reload();
                } catch (err) {
                  toast.error(err instanceof ApiError ? err.message : "خطا در ذخیره ترتیب");
                  throw err;
                }
              }
            : undefined
        }
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          dir="rtl"
          className="max-h-[90vh] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto sm:max-w-3xl"
        >
          <DialogHeader className="text-start">
            <DialogTitle>
              {mode === "create" ? "ایجاد" : "ویرایش"} — {title}
            </DialogTitle>
          </DialogHeader>

          {seoTarget ? (
            <Tabs value={formTab} onValueChange={setFormTab} className="w-full">
              <TabsList className="mb-2 w-full justify-start">
                <TabsTrigger value="info">اطلاعات</TabsTrigger>
                <TabsTrigger value="seo">SEO</TabsTrigger>
              </TabsList>
              <TabsContent value="info" className="mt-0">
                <FormFieldsGrid
                  fields={normalizedFields}
                  values={values}
                  setValues={setValues}
                  currentId={current?.id}
                  nestedTree={isNested ? nestedList.tree : undefined}
                  seoTarget={seoTarget}
                  setSeo={setSeo}
                />
              </TabsContent>
              <TabsContent value="seo" className="mt-0">
                <SeoFields
                  value={{
                    ...seo,
                    targetPath: seo.targetPath || resolveTargetPath(values),
                  }}
                  onChange={setSeo}
                />
              </TabsContent>
            </Tabs>
          ) : (
            <FormFieldsGrid
              fields={normalizedFields}
              values={values}
              setValues={setValues}
              currentId={current?.id}
              nestedTree={isNested ? nestedList.tree : undefined}
            />
          )}

          <DialogFooter className="gap-2 sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              انصراف
            </Button>
            <Button
              type="button"
              disabled={busy}
              onClick={async () => {
                for (const f of normalizedFields) {
                  if (
                    isFieldRequired(f) &&
                    (values[f.name] === undefined ||
                      values[f.name] === null ||
                      String(values[f.name]).trim() === "")
                  ) {
                    toast.error(`فیلد «${f.label}» الزامی است`);
                    setFormTab("info");
                    return;
                  }
                }
                setBusy(true);
                try {
                  const body = mapFormToBody ? mapFormToBody(values, mode) : values;
                  const cleanBody = { ...body } as Record<string, unknown>;
                  for (const key of Object.keys(cleanBody)) {
                    if (key.endsWith("Label")) delete cleanBody[key];
                  }
                  let entityId = current?.id || "";
                  if (mode === "create") {
                    const created = await apiPost<{ content: { id: string } }>(path, cleanBody);
                    entityId = created.content.id;
                    toast.success("ایجاد شد");
                  } else if (current) {
                    await apiPut(`${path}/${current.id}`, cleanBody);
                    entityId = current.id;
                    toast.success("ذخیره شد");
                  }
                  if (seoTarget && entityId) {
                    const targetPath =
                      seo.targetPath.trim() ||
                      buildSeoPath(seoTarget.type, String(values.slug ?? ""));
                    await upsertEntitySeo({
                      targetType: seoTarget.type,
                      targetId: entityId,
                      targetPath,
                      pageId: seoTarget.linkPageId ? entityId : null,
                      form: { ...seo, targetPath },
                    });
                  }
                  setOpen(false);
                  list.reload();
                } catch (err) {
                  toast.error(err instanceof ApiError ? err.message : "خطا در ذخیره");
                } finally {
                  setBusy(false);
                }
              }}
            >
              ذخیره
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDelete
        open={Boolean(deleteId)}
        onOpenChange={(v) => !v && setDeleteId(null)}
        onConfirm={async () => {
          if (!deleteId) return;
          await apiDelete(`${path}/${deleteId}`);
          list.reload();
        }}
      />
    </div>
  );
}
