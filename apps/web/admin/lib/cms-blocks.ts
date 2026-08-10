/** بلوک‌های صفحه‌ساز هم‌تراز با سکشن‌های صفحه اصلی + schema زیر‌سکشن */

export type BlockSourceType = "STATIC" | "ENTITY_QUERY" | "ENTITY_REF";

export type EntityType =
  | "product"
  | "blog"
  | "comment"
  | "blog_category"
  | "product_category";

export const ENTITY_OPTIONS: Array<{ value: EntityType; label: string }> = [
  { value: "product", label: "محصول" },
  { value: "blog", label: "مطلب وبلاگ" },
  { value: "comment", label: "نظر کاربران" },
  { value: "blog_category", label: "دسته وبلاگ" },
  { value: "product_category", label: "دسته محصول" },
];

export const SORT_OPTIONS = [
  { value: "-createdAt", label: "جدیدترین" },
  { value: "createdAt", label: "قدیمی‌ترین" },
  { value: "title", label: "عنوان (الفبا)" },
  { value: "-title", label: "عنوان (معکوس)" },
  { value: "sortOrder", label: "ترتیب دستی" },
];

export const ENTITY_QUERY_BLOCK_TYPES = new Set([
  "entity_slider",
  "product_grid",
  "blog_list",
  "blog_grid",
  "comment_list",
  "blog_category_grid",
]);

export function isEntityQueryBlock(type: string) {
  return ENTITY_QUERY_BLOCK_TYPES.has(type);
}

export function defaultEntityForBlockType(type: string): EntityType {
  switch (type) {
    case "blog_list":
    case "blog_grid":
      return "blog";
    case "comment_list":
      return "comment";
    case "blog_category_grid":
      return "blog_category";
    case "product_grid":
    case "entity_slider":
    default:
      return "product";
  }
}

export type SlotKind =
  | "text"
  | "textarea"
  | "url"
  | "image"
  | "color"
  | "number"
  | "group"
  | "list";

export type SlotField = {
  key: string;
  label: string;
  kind: Exclude<SlotKind, "group" | "list">;
};

export type SectionSlot = {
  id: string;
  label: string;
  /** مسیر در payload مثل title یا primaryCta یا benefits */
  path: string;
  kind: SlotKind;
  /** برای group */
  fields?: SlotField[];
  /** برای list: شکل هر آیتم */
  itemFields?: SlotField[];
  /** برچسب پیش‌فرض آیتم لیست */
  itemLabel?: string;
};

export type CmsBlockDefinition = {
  value: string;
  label: string;
  sourceType: BlockSourceType;
  defaultPayload: Record<string, unknown>;
  slots: SectionSlot[];
};

const ctaFields: SlotField[] = [
  { key: "label", label: "متن دکمه", kind: "text" },
  { key: "href", label: "لینک", kind: "url" },
];

const faqItemFields: SlotField[] = [
  { key: "title", label: "سوال", kind: "text" },
  { key: "content", label: "پاسخ (HTML)", kind: "textarea" },
];

export const BLOCK_TYPES: CmsBlockDefinition[] = [
  {
    value: "hero",
    label: "هیرو",
    sourceType: "STATIC",
    defaultPayload: {
      title: "از دل طبیعت، مستقیم برای گلدون تو",
      titleAccent: "طبیعت",
      subtitle:
        "با کودهای ارگانیک ما، بدون بوی بد و مواد شیمیایی، گیاهات رو زنده کن.",
      image: "/homeheader.jpg",
      primaryCta: { label: "درباره‌ ما", href: "/products" },
      secondaryCta: { label: "خرید کودهای خانگی", href: "/products" },
      accentColor: "#B1D082",
      buttonColor: "#308060",
    },
    slots: [
      { id: "image", label: "تصویر پس‌زمینه", path: "image", kind: "image" },
      { id: "title", label: "عنوان", path: "title", kind: "text" },
      { id: "titleAccent", label: "کلمه اکسنت", path: "titleAccent", kind: "text" },
      { id: "subtitle", label: "زیرعنوان", path: "subtitle", kind: "textarea" },
      {
        id: "primaryCta",
        label: "دکمه اصلی",
        path: "primaryCta",
        kind: "group",
        fields: ctaFields,
      },
      {
        id: "secondaryCta",
        label: "دکمه ثانویه",
        path: "secondaryCta",
        kind: "group",
        fields: ctaFields,
      },
      { id: "accentColor", label: "رنگ اکسنت", path: "accentColor", kind: "color" },
      { id: "buttonColor", label: "رنگ دکمه", path: "buttonColor", kind: "color" },
    ],
  },
  {
    value: "about",
    label: "درباره کوتاه",
    sourceType: "STATIC",
    defaultPayload: {
      title: "یک انتخاب سبز برای",
      titleAccent: "خونه‌های سبز",
      text: "جایی که کیفیت، دوام و سلامت محیط‌زیست کنار هم جمع می‌شن. ما محصولاتمون رو با مواد کاملاً طبیعی و استانداردهای سخت‌گیرانه تولید می‌کنیم تا هم طول عمر بالایی داشته باشن، هم برای خانواده‌ت امن باشن. ترکیب تجربه‌ی سال‌ها کار تخصصی با فناوری روز، باعث شده بتونیم راهکارهایی ارائه بدیم که هم ظاهر فضای شما رو زیباتر کنه و هم کمترین آسیب رو به طبیعت بزنه.",
      benefits: [
        "محصولات 100% ارگانیک و طبیعی",
        "بدون بو و مواد شیمیایی مضر",
        "تضمین کیفیت و رضایت مشتری",
      ],
      years: 24,
      yearsLabel: "سال تجربه",
      images: ["/homeheader.jpg", "/a1.png", "/a2.png"],
    },
    slots: [
      {
        id: "images",
        label: "تصاویر کلاژ",
        path: "images",
        kind: "list",
        itemLabel: "تصویر",
        itemFields: [{ key: "_value", label: "آدرس تصویر", kind: "image" }],
      },
      { id: "title", label: "عنوان", path: "title", kind: "text" },
      { id: "titleAccent", label: "اکسنت عنوان", path: "titleAccent", kind: "text" },
      { id: "text", label: "متن معرفی", path: "text", kind: "textarea" },
      {
        id: "benefits",
        label: "مزیت‌ها",
        path: "benefits",
        kind: "list",
        itemLabel: "مزیت",
        itemFields: [{ key: "_value", label: "متن", kind: "text" }],
      },
      { id: "years", label: "تعداد سال", path: "years", kind: "number" },
      { id: "yearsLabel", label: "برچسب سال", path: "yearsLabel", kind: "text" },
    ],
  },
  {
    value: "banner",
    label: "بنر",
    sourceType: "STATIC",
    defaultPayload: {
      title: "زندگی سبز از تو خونه شروع می‌شه!",
      titleAccent: "سبز",
      text: "لورم ایپــــــسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ، و با استفاده از طراحان گرافیک است!",
      image: "/b1.jpg",
      cta: { label: "کودهای آپارتمانی", href: "/products" },
      accentColor: "#F3CC30",
    },
    slots: [
      { id: "image", label: "تصویر بنر", path: "image", kind: "image" },
      { id: "title", label: "عنوان", path: "title", kind: "text" },
      { id: "titleAccent", label: "کلمه اکسنت", path: "titleAccent", kind: "text" },
      { id: "text", label: "توضیح", path: "text", kind: "textarea" },
      {
        id: "cta",
        label: "دکمه",
        path: "cta",
        kind: "group",
        fields: ctaFields,
      },
      { id: "accentColor", label: "رنگ اکسنت", path: "accentColor", kind: "color" },
    ],
  },
  {
    value: "entity_slider",
    label: "اسلایدر محتوا",
    sourceType: "ENTITY_QUERY",
    defaultPayload: {
      entity: "product",
      sort: "-createdAt",
      limit: 10,
      eyebrow: "فروشگاه آگروهوم",
      title: "جدیدترین محصولات",
      showAllHref: "/products",
      variant: "slider",
    },
    slots: [
      { id: "eyebrow", label: "خط بالای عنوان", path: "eyebrow", kind: "text" },
      { id: "title", label: "عنوان", path: "title", kind: "text" },
      { id: "showAllHref", label: "لینک مشاهده همه", path: "showAllHref", kind: "url" },
    ],
  },
  {
    value: "blog_category_grid",
    label: "آموزش‌ها (دسته وبلاگ)",
    sourceType: "ENTITY_QUERY",
    defaultPayload: {
      entity: "blog_category",
      parentSlug: "tutorials",
      limit: 6,
      eyebrow: "هر گیاهی، کود مخصوص خودش رو می‌خواد!",
      title: "راهنمای استفاده بر اساس نوع گیاه",
      variant: "category_grid",
    },
    slots: [
      { id: "eyebrow", label: "خط بالای عنوان", path: "eyebrow", kind: "text" },
      { id: "title", label: "عنوان", path: "title", kind: "text" },
    ],
  },
  {
    value: "product_grid",
    label: "محصولات (پیش‌تنظیم)",
    sourceType: "ENTITY_QUERY",
    defaultPayload: {
      entity: "product",
      sort: "-createdAt",
      limit: 10,
      eyebrow: "فروشگاه آگروهوم",
      title: "جدیدترین محصولات",
      showAllHref: "/products",
      variant: "slider",
    },
    slots: [
      { id: "eyebrow", label: "خط بالای عنوان", path: "eyebrow", kind: "text" },
      { id: "title", label: "عنوان", path: "title", kind: "text" },
      { id: "showAllHref", label: "لینک مشاهده همه", path: "showAllHref", kind: "url" },
    ],
  },
  {
    value: "comment_list",
    label: "نظرات (پیش‌تنظیم)",
    sourceType: "ENTITY_QUERY",
    defaultPayload: {
      entity: "comment",
      sort: "-createdAt",
      limit: 12,
      title: "نظرات و رضایت مشتریان از محصولات ما",
      targetType: "product",
      variant: "comment_slider",
    },
    slots: [{ id: "title", label: "عنوان", path: "title", kind: "textarea" }],
  },
  {
    value: "faq",
    label: "سوالات متداول",
    sourceType: "STATIC",
    defaultPayload: {
      eyebrow: "سوالات متداول مشتریان",
      title: "بیشترین سوالاتی که تا الان از ما پرسیده شده ..",
      images: ["/faq1.png", "/faq2.png"],
      items: [
        {
          title: "کودهای شما ارگانیک هستند؟",
          content:
            "<p>بله، محصولات ما بر پایه مواد طبیعی و استاندارد تولید می‌شوند.</p>",
        },
        {
          title: "چطور بهترین کود را انتخاب کنم؟",
          content:
            "<p>با توجه به نوع گیاه از بخش آموزش‌ها راهنمایی بگیرید یا با پشتیبانی تماس بگیرید.</p>",
        },
      ],
    },
    slots: [
      { id: "eyebrow", label: "خط بالای عنوان", path: "eyebrow", kind: "text" },
      { id: "title", label: "عنوان", path: "title", kind: "text" },
      {
        id: "images",
        label: "تصاویر",
        path: "images",
        kind: "list",
        itemLabel: "تصویر",
        itemFields: [{ key: "_value", label: "آدرس تصویر", kind: "image" }],
      },
      {
        id: "items",
        label: "سوالات",
        path: "items",
        kind: "list",
        itemLabel: "سوال",
        itemFields: faqItemFields,
      },
    ],
  },
  {
    value: "blog_list",
    label: "مطالب (پیش‌تنظیم)",
    sourceType: "ENTITY_QUERY",
    defaultPayload: {
      entity: "blog",
      sort: "-createdAt",
      limit: 10,
      eyebrow: "اخبار و مقالات",
      title: "جدیدترین اخبار و مقالات",
      showAllHref: "/blogs",
      variant: "slider",
    },
    slots: [
      { id: "eyebrow", label: "خط بالای عنوان", path: "eyebrow", kind: "text" },
      { id: "title", label: "عنوان", path: "title", kind: "text" },
      { id: "showAllHref", label: "لینک مشاهده همه", path: "showAllHref", kind: "url" },
    ],
  },
  {
    value: "rich_text",
    label: "متن غنی",
    sourceType: "STATIC",
    defaultPayload: { title: "", text: "متن این بخش را بنویسید…" },
    slots: [
      { id: "title", label: "عنوان", path: "title", kind: "text" },
      { id: "text", label: "متن", path: "text", kind: "textarea" },
    ],
  },
  {
    value: "custom",
    label: "سفارشی",
    sourceType: "STATIC",
    defaultPayload: { title: "بخش سفارشی" },
    slots: [{ id: "title", label: "عنوان", path: "title", kind: "text" }],
  },
];

export function blockTypeLabel(type: string) {
  return BLOCK_TYPES.find((t) => t.value === type)?.label || type;
}

export function getBlockDef(type: string) {
  return BLOCK_TYPES.find((t) => t.value === type);
}

export function getSlots(type: string): SectionSlot[] {
  return getBlockDef(type)?.slots || [];
}

export function defaultPayloadFor(type: string): Record<string, unknown> {
  return {
    ...(BLOCK_TYPES.find((t) => t.value === type)?.defaultPayload || {
      title: "بخش جدید",
    }),
  };
}

export function defaultSourceTypeFor(type: string): BlockSourceType {
  return BLOCK_TYPES.find((t) => t.value === type)?.sourceType || "STATIC";
}

/** قالب کامل صفحه اصلی — اسلایدرها با entity_slider و انتخاب نوع محتوا از UI */
export const HOME_PAGE_TEMPLATE = [
  { type: "hero", name: "هیرو" },
  { type: "about", name: "درباره کوتاه" },
  { type: "banner", name: "بنر" },
  {
    type: "entity_slider",
    name: "آموزش‌ها",
    payload: {
      entity: "blog_category",
      parentSlug: "tutorials",
      limit: 6,
      eyebrow: "هر گیاهی، کود مخصوص خودش رو می‌خواد!",
      title: "راهنمای استفاده بر اساس نوع گیاه",
      variant: "category_grid",
    },
  },
  {
    type: "entity_slider",
    name: "جدیدترین محصولات",
    payload: {
      entity: "product",
      sort: "-createdAt",
      limit: 10,
      eyebrow: "فروشگاه آگروهوم",
      title: "جدیدترین محصولات",
      showAllHref: "/products",
      variant: "slider",
    },
  },
  {
    type: "entity_slider",
    name: "نظرات کاربران",
    payload: {
      entity: "comment",
      sort: "-createdAt",
      limit: 12,
      title: "نظرات و رضایت مشتریان از محصولات ما",
      targetType: "product",
      variant: "comment_slider",
    },
  },
  { type: "faq", name: "سوالات متداول" },
  {
    type: "entity_slider",
    name: "جدیدترین مطالب",
    payload: {
      entity: "blog",
      sort: "-createdAt",
      limit: 10,
      eyebrow: "اخبار و مقالات",
      title: "جدیدترین اخبار و مقالات",
      showAllHref: "/blogs",
      variant: "slider",
    },
  },
].map((item, sortOrder) => {
  const def = BLOCK_TYPES.find((t) => t.value === item.type)!;
  return {
    type: def.value,
    name: item.name,
    sortOrder,
    isVisible: true,
    sourceType: def.sourceType,
    payload: structuredClone(
      "payload" in item && item.payload ? item.payload : def.defaultPayload
    ),
  };
});

export type Selection = {
  blockId: string;
  /** خالی = خود سکشن؛ وگرنه path مثل title یا items.0 */
  path: string | null;
};

function parsePath(path: string): Array<string | number> {
  return path.split(".").map((part) => (/^\d+$/.test(part) ? Number(part) : part));
}

export function getValueAtPath(payload: Record<string, unknown>, path: string): unknown {
  if (!path) return payload;
  const parts = parsePath(path);
  let cur: unknown = payload;
  for (const p of parts) {
    if (cur == null) return undefined;
    if (typeof p === "number") {
      cur = Array.isArray(cur) ? cur[p] : undefined;
    } else {
      cur = (cur as Record<string, unknown>)[p];
    }
  }
  return cur;
}

export function setValueAtPath(
  payload: Record<string, unknown>,
  path: string,
  value: unknown
): Record<string, unknown> {
  if (!path) return (value as Record<string, unknown>) || {};
  const parts = parsePath(path);
  const root = structuredClone(payload) as Record<string, unknown>;
  let cur: unknown = root;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    const next = parts[i + 1];
    if (typeof p === "number") {
      const arr = cur as unknown[];
      if (arr[p] == null) arr[p] = typeof next === "number" ? [] : {};
      cur = arr[p];
    } else {
      const obj = cur as Record<string, unknown>;
      if (obj[p] == null) obj[p] = typeof next === "number" ? [] : {};
      cur = obj[p];
    }
  }
  const last = parts[parts.length - 1];
  if (typeof last === "number") {
    (cur as unknown[])[last] = value;
  } else {
    (cur as Record<string, unknown>)[last] = value;
  }
  return root;
}

/** برای لیست‌های رشته‌ای (benefits / images) مقدار آیتم یا آبجکت */
export function isPrimitiveList(slot: SectionSlot) {
  return (
    slot.kind === "list" &&
    slot.itemFields?.length === 1 &&
    slot.itemFields[0].key === "_value"
  );
}

export function listItemLabel(slot: SectionSlot, index: number, value: unknown) {
  if (isPrimitiveList(slot)) {
    const text = String(value ?? "");
    return text ? `${slot.itemLabel || "آیتم"} ${index + 1}: ${text.slice(0, 24)}` : `${slot.itemLabel || "آیتم"} ${index + 1}`;
  }
  if (value && typeof value === "object" && "title" in (value as object)) {
    return String((value as { title?: string }).title || `${slot.itemLabel || "آیتم"} ${index + 1}`);
  }
  return `${slot.itemLabel || "آیتم"} ${index + 1}`;
}

/** نودهای navigator برای یک بلوک */
export function expandNavigatorNodes(
  type: string,
  payload: Record<string, unknown>
): Array<{ path: string; label: string; slotId: string }> {
  const nodes: Array<{ path: string; label: string; slotId: string }> = [];
  for (const slot of getSlots(type)) {
    if (slot.kind === "list") {
      nodes.push({ path: slot.path, label: slot.label, slotId: slot.id });
      const arr = getValueAtPath(payload, slot.path);
      if (Array.isArray(arr)) {
        arr.forEach((item, index) => {
          nodes.push({
            path: `${slot.path}.${index}`,
            label: listItemLabel(slot, index, item),
            slotId: `${slot.id}.${index}`,
          });
        });
      }
    } else {
      nodes.push({ path: slot.path, label: slot.label, slotId: slot.id });
    }
  }
  return nodes;
}

export function findSlotForPath(type: string, path: string | null): SectionSlot | null {
  if (!path) return null;
  const slots = getSlots(type);
  const direct = slots.find((s) => s.path === path);
  if (direct) return direct;
  // items.0 → parent list slot items
  const parentPath = path.replace(/\.\d+$/, "");
  if (parentPath !== path) {
    return slots.find((s) => s.path === parentPath && s.kind === "list") || null;
  }
  return null;
}

export function isListItemPath(path: string) {
  return /\.\d+$/.test(path);
}
