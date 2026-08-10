"use client";

import { useEffect, useMemo, useState } from "react";
import { ImageIcon, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { MediaPicker } from "@/components/media/media-picker";
import { mediaUrl } from "@/lib/utils";

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
};

export function SectionInspector({
  block,
  selection,
  busy,
  onSave,
  onDelete,
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
    return slot?.label || path;
  }, [block, path, slot]);

  if (!block) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center" dir="rtl">
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
    <div className="flex h-full flex-col" dir="rtl">
      <div className="border-b border-[var(--admin-border)] px-4 py-3">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-[var(--admin-muted)]">
          {blockTypeLabel(block.type)}
          {path ? ` · ${path}` : " · تنظیمات سکشن"}
        </p>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        {!path ? (
          <>
            <div className="space-y-2">
              <Label>نام سکشن</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-[var(--admin-radius-sm)] border border-[var(--admin-border)] px-3 py-2">
              <Label htmlFor="vis">قابل نمایش</Label>
              <Switch id="vis" checked={isVisible} onCheckedChange={setIsVisible} />
            </div>
            <div className="space-y-2">
              <Label>Anchor</Label>
              <Input value={anchor} onChange={(e) => setAnchor(e.target.value)} dir="ltr" />
            </div>
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
                    <p key={s.id} className="text-xs text-[var(--admin-muted)]">
                      • {s.label}
                    </p>
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
          <ListItemEditor slot={slot} value={draft} onChange={setDraft} />
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

      <div className="border-t border-[var(--admin-border)] p-3">
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
  const [pickerOpen, setPickerOpen] = useState(false);

  if (kind === "textarea") {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <Textarea
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[120px]"
        />
      </div>
    );
  }
  if (kind === "number") {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <Input
          type="number"
          value={value === undefined || value === null ? "" : String(value)}
          onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
          dir="ltr"
        />
      </div>
    );
  }
  if (kind === "color") {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
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
      </div>
    );
  }
  if (kind === "image") {
    const media =
      value && typeof value === "object" && !Array.isArray(value)
        ? (value as { url?: string; alt?: string | null })
        : typeof value === "string" && value
          ? { url: value, alt: null }
          : null;
    const url = media?.url || "";
    const preview = mediaUrl(url);
    return (
      <div className="space-y-3 rounded-[var(--admin-radius-sm)] border border-[var(--admin-border)] bg-[var(--admin-bg)]/30 p-3">
        <Label>{label}</Label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1 space-y-2">
            <Input
              value={url}
              onChange={(e) => {
                const nextUrl = e.target.value.trim();
                onChange(nextUrl ? { url: nextUrl, alt: media?.alt ?? null } : null);
              }}
              placeholder="URL یا از کتابخانه انتخاب کنید"
              dir="ltr"
            />
          </div>
          <Button type="button" size="sm" variant="secondary" onClick={() => setPickerOpen(true)}>
            <ImageIcon className="h-4 w-4" />
            انتخاب از رسانه
          </Button>
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-[var(--admin-muted)]">alt</Label>
          <Input
            value={media?.alt || ""}
            onChange={(e) => {
              if (!url) return;
              onChange({ url, alt: e.target.value || null });
            }}
            placeholder="متن جایگزین"
            disabled={!url}
          />
        </div>
        {preview ? (
          <div className="overflow-hidden rounded-lg border border-[var(--admin-border)] bg-black/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt={media?.alt || ""} className="mx-auto max-h-32 object-contain" />
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
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        dir={kind === "url" ? "ltr" : undefined}
      />
    </div>
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
  const primitive = isPrimitiveList(slot);

  function addItem() {
    if (primitive) {
      onChange([...items, ""]);
    } else {
      const blank: Record<string, unknown> = {};
      for (const f of slot.itemFields || []) blank[f.key] = "";
      onChange([...items, blank]);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>{slot.label}</Label>
        <Button type="button" size="sm" variant="secondary" onClick={addItem}>
          <Plus className="h-3.5 w-3.5" />
          افزودن
        </Button>
      </div>
      {items.map((item, index) => (
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
      ))}
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
