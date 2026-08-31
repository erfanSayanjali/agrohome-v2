"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { FormField } from "@/components/ui/form-field";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  blockTypeLabel,
  findSlotForPath,
  getSlots,
  getValueAtPath,
  defaultEntityForBlockType,
  isEntityQueryBlock,
  isListItemPath,
  isPrimitiveList,
  setValueAtPath,
  type Selection,
} from "@/lib/cms-blocks";
import {
  EntityQueryEditor,
  payloadToQueryDraft,
  queryDraftToPayload,
  type EntityQueryDraft,
} from "@/components/cms/entity-query-editor";
import { MediaField } from "@/components/media/media-field";
import { mediaUrl } from "@/lib/utils";
import { toMediaRef } from "@agrohome/shared";

export type InspectorBlock = {
  id: string;
  type: string;
  name?: string | null;
  isVisible: boolean;
  sourceType: string;
  payload: Record<string, unknown>;
  anchor?: string | null;
};

type SectionInspectorProps = {
  block: InspectorBlock | null;
  selection: Selection | null;
  busy: boolean;
  onSave: (patch: Partial<InspectorBlock>) => void;
  onDelete: () => void;
  onSelectPath?: (path: string | null) => void;
};

export function SectionInspector({
  block,
  selection,
  busy,
  onSave,
  onDelete,
  onSelectPath,
}: SectionInspectorProps) {
  const path = selection?.path ?? null;
  const slot = block ? findSlotForPath(block.type, path) : null;

  const [name, setName] = useState("");
  const [isVisible, setIsVisible] = useState(true);
  const [anchor, setAnchor] = useState("");
  const [draft, setDraft] = useState<unknown>(null);
  const [listDraft, setListDraft] = useState<unknown[]>([]);
  const [queryDraft, setQueryDraft] = useState<EntityQueryDraft | null>(null);

  const entityQuery = block ? isEntityQueryBlock(block.type) : false;

  useEffect(() => {
    if (!block) return;
    setName(block.name || "");
    setIsVisible(block.isVisible);
    setAnchor(block.anchor || "");
    if (isEntityQueryBlock(block.type)) {
      setQueryDraft(
        payloadToQueryDraft(block.payload || {}, defaultEntityForBlockType(block.type))
      );
    } else {
      setQueryDraft(null);
    }
    if (!path) {
      setDraft(null);
      setListDraft([]);
      return;
    }
    if (slot?.kind === "list" && !isListItemPath(path)) {
      const arr = getValueAtPath(block.payload, path);
      setListDraft(Array.isArray(arr) ? structuredClone(arr) : []);
      setDraft(null);
    } else {
      setDraft(structuredClone(getValueAtPath(block.payload, path)));
      setListDraft([]);
    }
  }, [block, path, slot?.kind, slot?.path]);

  const title = useMemo(() => {
    if (!block) return "انتخاب نشده";
    if (!path) return block.name || blockTypeLabel(block.type);
    if (slot?.kind === "list" && isListItemPath(path)) {
      const match = path.match(/\.(\d+)$/);
      const index = match ? Number(match[1]) : 0;
      return `${slot.itemLabel || slot.label} ${index + 1}`;
    }
    return slot?.label || path;
  }, [block, path, slot]);

  if (!block) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center p-6 text-center" dir="rtl">
        <p className="text-sm font-medium">چیزی انتخاب نشده</p>
        <p className="mt-1 text-xs text-[var(--admin-muted)]">
          یک سکشن یا زیر‌المان را از بوم یا ساختار انتخاب کنید.
        </p>
      </div>
    );
  }

  function saveSectionMeta() {
    if (entityQuery && queryDraft) {
      onSave({
        name,
        isVisible,
        anchor: anchor || null,
        payload: queryDraftToPayload(block!.payload || {}, queryDraft),
      });
      return;
    }
    onSave({ name, isVisible, anchor: anchor || null });
  }

  function savePathValue() {
    if (!path) {
      saveSectionMeta();
      return;
    }
    let nextPayload: Record<string, unknown>;
    if (slot?.kind === "list" && !isListItemPath(path)) {
      nextPayload = setValueAtPath(block!.payload, path, listDraft);
    } else {
      nextPayload = setValueAtPath(block!.payload, path, draft);
    }
    onSave({ payload: nextPayload });
  }

  return (
    <div className="flex h-full min-h-0 flex-col" dir="rtl">
      <div className="shrink-0 border-b border-[var(--admin-border)] px-4 py-3">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-[var(--admin-muted)]">
          {blockTypeLabel(block.type)}
          {path ? ` · ${path}` : " · تنظیمات سکشن"}
        </p>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4">
        {!path ? (
          <>
            <FormField label="نام سکشن">
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </FormField>
            <FormField label="قابل نمایش" htmlFor="vis">
              <div
                dir="rtl"
                className="flex h-10 items-center justify-between gap-3 rounded-[var(--admin-radius-sm)] border border-[var(--admin-border)] bg-[var(--admin-bg-elevated)] px-3"
              >
                <span className="text-sm text-[var(--admin-muted)]">
                  {isVisible ? "فعال" : "غیرفعال"}
                </span>
                <Switch id="vis" checked={isVisible} onCheckedChange={setIsVisible} />
              </div>
            </FormField>
            <FormField label="Anchor">
              <Input value={anchor} onChange={(e) => setAnchor(e.target.value)} dir="ltr" />
            </FormField>
            {entityQuery && queryDraft ? (
              <>
                <Separator />
                <EntityQueryEditor value={queryDraft} onChange={setQueryDraft} />
              </>
            ) : (
              <>
                <Separator />
                <p className="text-xs text-[var(--admin-muted)]">
                  برای ویرایش محتوا، روی زیر‌بخش‌های بوم یا درخت کلیک کنید.
                </p>
                <div className="space-y-1">
                  {getSlots(block.type).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className="block w-full rounded-md px-2 py-1.5 text-start text-xs text-[var(--admin-muted)] transition hover:bg-[var(--admin-bg)] hover:text-[var(--admin-fg)]"
                      onClick={() => onSelectPath?.(s.path)}
                    >
                      • {s.label}
                    </button>
                  ))}
                </div>
              </>
            )}
            <Button type="button" variant="ghost" className="w-full text-[var(--admin-danger)]" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
              حذف سکشن
            </Button>
          </>
        ) : slot?.kind === "list" && !isListItemPath(path) ? (
          <ListEditor
            slot={slot}
            items={listDraft}
            onChange={setListDraft}
          />
        ) : slot?.kind === "list" && isListItemPath(path) ? (
          <div className="space-y-3">
            {onSelectPath && slot.path ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8 px-2 text-xs"
                onClick={() => onSelectPath(slot.path)}
              >
                ← همه {slot.label}
              </Button>
            ) : null}
            <ListItemEditor slot={slot} value={draft} onChange={setDraft} />
          </div>
        ) : slot?.kind === "group" ? (
          <GroupEditor
            fields={slot.fields || []}
            value={(draft as Record<string, unknown>) || {}}
            onChange={setDraft}
          />
        ) : (
          <FieldControl
            kind={slot?.kind || "text"}
            label={slot?.label || "مقدار"}
            value={draft}
            onChange={setDraft}
          />
        )}
      </div>

      <div className="shrink-0 border-t border-[var(--admin-border)] bg-[var(--admin-surface)] p-3">
        <Button type="button" className="w-full" disabled={busy} onClick={savePathValue}>
          ذخیره
        </Button>
      </div>
    </div>
  );
}

function FieldControl({
  kind,
  label,
  value,
  onChange,
}: {
  kind: string;
  label: string;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  if (kind === "textarea") {
    return (
      <FormField label={label}>
        <Textarea
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[120px]"
        />
      </FormField>
    );
  }
  if (kind === "richtext") {
    return (
      <FormField label={label}>
        <RichTextEditor
          value={String(value ?? "")}
          onChange={(html) => onChange(html)}
          height={260}
        />
      </FormField>
    );
  }
  if (kind === "number") {
    return (
      <FormField label={label}>
        <Input
          type="number"
          value={value === undefined || value === null ? "" : String(value)}
          onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
          dir="ltr"
        />
      </FormField>
    );
  }
  if (kind === "color") {
    return (
      <FormField label={label}>
        <div className="flex gap-2">
          <Input
            type="color"
            className="h-10 w-14 p-1"
            value={String(value || "#308060")}
            onChange={(e) => onChange(e.target.value)}
          />
          <Input
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            dir="ltr"
          />
        </div>
      </FormField>
    );
  }
  if (kind === "image") {
    return (
      <MediaField
        label={label}
        value={value}
        onChange={(next) => onChange(next)}
      />
    );
  }
  return (
    <FormField label={label}>
      <Input
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        dir={kind === "url" ? "ltr" : undefined}
      />
    </FormField>
  );
}

function GroupEditor({
  fields,
  value,
  onChange,
}: {
  fields: Array<{ key: string; label: string; kind: string }>;
  value: Record<string, unknown>;
  onChange: (v: unknown) => void;
}) {
  return (
    <div className="space-y-3">
      {fields.map((f) => (
        <FieldControl
          key={f.key}
          kind={f.kind}
          label={f.label}
          value={value[f.key]}
          onChange={(v) => onChange({ ...value, [f.key]: v })}
        />
      ))}
    </div>
  );
}

function ListEditor({
  slot,
  items,
  onChange,
}: {
  slot: NonNullable<ReturnType<typeof findSlotForPath>>;
  items: unknown[];
  onChange: (items: unknown[]) => void;
}) {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const primitive = isPrimitiveList(slot);
  const isImageList =
    primitive && (slot.itemFields?.[0]?.kind || "") === "image";

  function addItem() {
    const nextIndex = items.length;
    if (primitive) {
      onChange([...items, isImageList ? null : ""]);
    } else {
      const blank: Record<string, unknown> = {};
      for (const f of slot.itemFields || []) blank[f.key] = "";
      onChange([...items, blank]);
    }
    if (isImageList) setFocusedIndex(nextIndex);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-right text-sm font-medium">{slot.label}</p>
        <Button type="button" size="sm" variant="secondary" onClick={addItem}>
          <Plus className="h-3.5 w-3.5" />
          افزودن
        </Button>
      </div>

      {isImageList && items.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {items.map((item, index) => {
            const ref = toMediaRef(item);
            const preview = mediaUrl(ref?.url);
            const active = focusedIndex === index;
            return (
              <div
                key={index}
                className={`group relative overflow-hidden rounded-[var(--admin-radius-sm)] border bg-[var(--admin-bg)]/40 ${
                  active
                    ? "border-[var(--admin-accent)] ring-2 ring-[var(--admin-accent)]/40"
                    : "border-[var(--admin-border)]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setFocusedIndex(index)}
                  className="block w-full text-start"
                  title={`تصویر ${index + 1}`}
                >
                  <div className="aspect-square bg-black/10">
                    {preview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={preview}
                        alt={ref?.alt || ""}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[10px] text-[var(--admin-muted)]">
                        خالی
                      </div>
                    )}
                  </div>
                  <span className="absolute bottom-1 start-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    {slot.itemLabel || "تصویر"} {index + 1}
                  </span>
                </button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="absolute top-1 end-1 h-7 w-7 bg-black/40 text-white hover:bg-black/60"
                  onClick={() => {
                    onChange(items.filter((_, i) => i !== index));
                    setFocusedIndex((prev) =>
                      prev > index ? prev - 1 : Math.min(prev, Math.max(0, items.length - 2))
                    );
                  }}
                  title="حذف"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      ) : null}

      {isImageList && items.length > 0 ? (
        <div className="space-y-2 rounded-[var(--admin-radius-sm)] border border-[var(--admin-accent)]/40 bg-[var(--admin-bg)]/20 p-3">
          <p className="text-xs font-medium text-[var(--admin-accent)]">
            در حال ویرایش: {slot.itemLabel || "تصویر"} {focusedIndex + 1}
          </p>
          <FieldControl
            kind="image"
            label={slot.itemFields?.[0]?.label || "تصویر"}
            value={items[focusedIndex]}
            onChange={(v) => {
              const next = [...items];
              next[focusedIndex] = v;
              onChange(next);
            }}
          />
        </div>
      ) : null}

      {!isImageList
        ? items.map((item, index) => (
            <div
              key={index}
              className="space-y-2 rounded-[var(--admin-radius-sm)] border border-[var(--admin-border)] p-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--admin-muted)]">
                  {slot.itemLabel || "آیتم"} {index + 1}
                </span>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => onChange(items.filter((_, i) => i !== index))}
                >
                  <Trash2 className="h-3.5 w-3.5 text-[var(--admin-danger)]" />
                </Button>
              </div>
              {primitive ? (
                <FieldControl
                  kind={slot.itemFields?.[0]?.kind || "text"}
                  label={slot.itemFields?.[0]?.label || "مقدار"}
                  value={item}
                  onChange={(v) => {
                    const next = [...items];
                    next[index] = v;
                    onChange(next);
                  }}
                />
              ) : (
                <GroupEditor
                  fields={slot.itemFields || []}
                  value={(item as Record<string, unknown>) || {}}
                  onChange={(v) => {
                    const next = [...items];
                    next[index] = v;
                    onChange(next);
                  }}
                />
              )}
            </div>
          ))
        : null}

      {items.length === 0 ? (
        <p className="text-xs text-[var(--admin-muted)]">لیست خالی است.</p>
      ) : null}
    </div>
  );
}

function ListItemEditor({
  slot,
  value,
  onChange,
}: {
  slot: NonNullable<ReturnType<typeof findSlotForPath>>;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  if (isPrimitiveList(slot)) {
    return (
      <FieldControl
        kind={slot.itemFields?.[0]?.kind || "text"}
        label={slot.itemFields?.[0]?.label || "مقدار"}
        value={value}
        onChange={onChange}
      />
    );
  }
  if (!value || typeof value !== "object") {
    return <p className="text-xs text-[var(--admin-muted)]">آیتم نامعتبر است.</p>;
  }
  return (
    <GroupEditor
      fields={slot.itemFields || []}
      value={value as Record<string, unknown>}
      onChange={onChange}
    />
  );
}
