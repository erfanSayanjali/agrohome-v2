"use client";

import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff } from "lucide-react";
import { Hotspot } from "@/components/cms/hotspot";
import {
  blockTypeLabel,
  defaultEntityForBlockType,
  isEntityQueryBlock,
  type EntityType,
} from "@/lib/cms-blocks";
import { cn, mediaUrl } from "@/lib/utils";
import { toMediaRef } from "@agrohome/shared";

type Block = {
  type: string;
  name?: string | null;
  isVisible: boolean;
  sourceType: string;
  payload: Record<string, unknown>;
};

function str(v: unknown, fallback = "") {
  return v == null || v === "" ? fallback : String(v);
}

function imageSrc(v: unknown, fallback = "") {
  const ref = toMediaRef(v);
  if (ref?.url) return mediaUrl(ref.url) || fallback;
  if (typeof v === "string" && v) return mediaUrl(v) || fallback;
  return fallback;
}

function asImageList(raw: unknown, minCount = 0, fallbacks: string[] = []): string[] {
  const list = Array.isArray(raw) ? raw : [];
  const mapped = list.map((item, i) => imageSrc(item, fallbacks[i] || "")).filter(Boolean);
  if (mapped.length >= minCount) return mapped;
  const out = [...mapped];
  while (out.length < minCount) {
    out.push(fallbacks[out.length] || "");
  }
  return out;
}

function ClickableImage({
  path,
  selected,
  onSelectPath,
  label,
  src,
  className,
  imgClassName,
}: {
  path: string;
  selected: boolean;
  onSelectPath: (path: string | null) => void;
  label: string;
  src: string;
  className?: string;
  imgClassName?: string;
}) {
  return (
    <Hotspot path={path} selected={selected} onSelect={onSelectPath} label={label} className={className}>
      <div className={cn("relative h-full w-full overflow-hidden bg-[#dfe8e2]", imgClassName)}>
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full min-h-[4rem] w-full items-center justify-center text-[10px] text-black/40">
            {label}
          </div>
        )}
        <span className="pointer-events-none absolute bottom-1 start-1 rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white">
          {label}
        </span>
      </div>
    </Hotspot>
  );
}

type SectionCanvasProps = {
  block: Block;
  selectedPath: string | null;
  sectionSelected: boolean;
  onSelectPath: (path: string | null) => void;
};

/** پیش‌نمایش سکشن با hotspot زیر‌المان‌ها */
export function SectionCanvas({
  block,
  selectedPath,
  sectionSelected,
  onSelectPath,
}: SectionCanvasProps) {
  const payload = block.payload || {};
  const sel = (path: string) => selectedPath === path;

  if (block.type === "hero") {
    const title = str(payload.title, "از دل طبیعت، مستقیم برای گلدون تو");
    const accent = str(payload.titleAccent, "طبیعت");
    const parts = title.split(accent);
    return (
      <div
        className="relative flex min-h-[220px] items-center justify-center overflow-hidden bg-[#00160E] px-6 py-16 text-white sm:min-h-[280px]"
        onClick={() => onSelectPath(null)}
      >
        <Hotspot
          path="image"
          selected={sel("image")}
          onSelect={onSelectPath}
          label="تصویر"
          className="absolute inset-0"
        >
          <div
            className="absolute inset-0 bg-cover bg-center opacity-50"
            style={{ backgroundImage: `url(${imageSrc(payload.image, "/homeheader.jpg")})` }}
          />
        </Hotspot>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#00160E] to-transparent" />
        <div className="relative z-[1] max-w-xl space-y-3 text-center">
          <Hotspot path="title" selected={sel("title")} onSelect={onSelectPath} label="عنوان">
            <h2 className="text-2xl font-extrabold sm:text-3xl">
              {parts.length > 1 ? (
                <>
                  {parts[0]}
                  <Hotspot
                    path="titleAccent"
                    selected={sel("titleAccent")}
                    onSelect={onSelectPath}
                    label="اکسنت"
                    className="inline"
                  >
                    <span style={{ color: str(payload.accentColor, "#B1D082") }}>{accent}</span>
                  </Hotspot>
                  {parts.slice(1).join(accent)}
                </>
              ) : (
                title
              )}
            </h2>
          </Hotspot>
          <Hotspot path="subtitle" selected={sel("subtitle")} onSelect={onSelectPath} label="زیرعنوان">
            <p className="text-sm text-white/90">{str(payload.subtitle)}</p>
          </Hotspot>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <Hotspot
              path="primaryCta"
              selected={sel("primaryCta")}
              onSelect={onSelectPath}
              label="CTA اصلی"
            >
              <span
                className="inline-block rounded-3xl px-4 py-2 text-sm font-bold"
                style={{ background: str(payload.buttonColor, "#308060") }}
              >
                {str((payload.primaryCta as { label?: string })?.label, "درباره‌ ما")}
              </span>
            </Hotspot>
            <Hotspot
              path="secondaryCta"
              selected={sel("secondaryCta")}
              onSelect={onSelectPath}
              label="CTA ثانویه"
            >
              <span className="inline-block rounded-3xl border border-white px-4 py-2 text-sm font-bold">
                {str((payload.secondaryCta as { label?: string })?.label, "خرید کودهای خانگی")}
              </span>
            </Hotspot>
          </div>
        </div>
      </div>
    );
  }

  if (block.type === "about") {
    const benefits = Array.isArray(payload.benefits)
      ? (payload.benefits as unknown[])
          .map((b) => (typeof b === "string" ? b : String((b as { _value?: string })?._value || "")))
          .filter(Boolean)
      : [];
    const images = asImageList(payload.images, 3, [
      "/homeheader.jpg",
      "/a1.png",
      "/a2.png",
    ]);

    return (
      <div
        className="mx-auto grid max-w-5xl gap-8 px-6 py-12 lg:grid-cols-2"
        dir="rtl"
        onClick={() => onSelectPath(null)}
      >
        <div className="grid h-[280px] grid-cols-2 grid-rows-[1fr_1.4fr] gap-3">
          <ClickableImage
            path="images.0"
            selected={sel("images.0") || sel("images")}
            onSelectPath={onSelectPath}
            label="تصویر ۱"
            src={images[0]}
            className="h-full"
            imgClassName="rounded-3xl rounded-tr-[80px]"
          />
          <ClickableImage
            path="images.1"
            selected={sel("images.1") || sel("images")}
            onSelectPath={onSelectPath}
            label="تصویر ۲"
            src={images[1]}
            className="row-span-2 h-full"
            imgClassName="rounded-r-3xl rounded-l-[90px]"
          />
          <ClickableImage
            path="images.2"
            selected={sel("images.2") || sel("images")}
            onSelectPath={onSelectPath}
            label="تصویر ۳"
            src={images[2]}
            className="w-4/5 justify-self-end"
            imgClassName="rounded-3xl rounded-b-[60px]"
          />
        </div>
        <div className="space-y-4">
          <Hotspot path="title" selected={sel("title")} onSelect={onSelectPath} label="عنوان">
            <p className="text-2xl font-extrabold text-black">
              {str(payload.title, "یک انتخاب سبز برای")}
              <br />
              <Hotspot
                path="titleAccent"
                selected={sel("titleAccent")}
                onSelect={onSelectPath}
                label="اکسنت"
                className="inline"
              >
                <span className="text-[#155038]">{str(payload.titleAccent, "خونه‌های سبز")}</span>
              </Hotspot>
            </p>
          </Hotspot>
          <Hotspot path="text" selected={sel("text")} onSelect={onSelectPath} label="متن">
            <p className="text-justify text-sm leading-7 text-black/70">
              {str(
                payload.text,
                "جایی که کیفیت، دوام و سلامت محیط‌زیست کنار هم جمع می‌شن…"
              )}
            </p>
          </Hotspot>
          <div className="flex gap-4">
            <div className="flex flex-1 flex-col gap-2">
              {(benefits.length ? benefits : ["مزیت ۱", "مزیت ۲", "مزیت ۳"])
                .slice(0, 3)
                .map((b, i) => (
                  <Hotspot
                    key={i}
                    path={`benefits.${i}`}
                    selected={sel(`benefits.${i}`)}
                    onSelect={onSelectPath}
                    label={`مزیت ${i + 1}`}
                  >
                    <div className="flex items-center gap-2 rounded-xl bg-[#F0F0F0] px-3 py-2 text-sm text-black">
                      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#308060] text-[10px] text-white">
                        ✓
                      </span>
                      {b}
                    </div>
                  </Hotspot>
                ))}
            </div>
            <Hotspot path="years" selected={sel("years")} onSelect={onSelectPath} label="سال تجربه">
              <div className="flex h-fit w-[100px] flex-col items-center justify-center rounded-b-[80px] border-t-4 border-[#0B3D2C] bg-[#F4C111] py-8 text-[#0B3D2C]">
                <p className="text-xl font-extrabold">{str(payload.years, "24")}+</p>
                <p className="text-xs font-extrabold">{str(payload.yearsLabel, "سال تجربه")}</p>
              </div>
            </Hotspot>
          </div>
        </div>
      </div>
    );
  }

  if (block.type === "banner") {
    return (
      <div className="relative my-4 overflow-hidden" onClick={() => onSelectPath(null)}>
        <Hotspot path="image" selected={sel("image")} onSelect={onSelectPath} label="تصویر" className="absolute inset-0">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${imageSrc(payload.image, "/b1.jpg")})` }}
          />
          <div className="absolute inset-0 bg-black/40" />
        </Hotspot>
        <div className="relative flex flex-col items-center justify-between gap-4 px-8 py-10 text-white md:flex-row md:py-12">
          <div>
            <Hotspot path="title" selected={sel("title")} onSelect={onSelectPath} label="عنوان">
              <p className="text-xl font-bold">{str(payload.title)}</p>
            </Hotspot>
            <Hotspot path="text" selected={sel("text")} onSelect={onSelectPath} label="متن">
              <p className="mt-2 text-sm text-white/90">{str(payload.text)}</p>
            </Hotspot>
          </div>
          <Hotspot path="cta" selected={sel("cta")} onSelect={onSelectPath} label="دکمه">
            <span className="rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-black">
              {str((payload.cta as { label?: string })?.label, "کودهای آپارتمانی")}
            </span>
          </Hotspot>
        </div>
      </div>
    );
  }

  if (block.type === "faq") {
    const items = Array.isArray(payload.items)
      ? (payload.items as Array<{ title?: string }>)
      : [];
    const images = asImageList(payload.images, 2, ["/faq1.png", "/faq2.png"]);
    return (
      <div className="bg-[#123833] px-6 py-12 text-white" onClick={() => onSelectPath(null)}>
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <div className="flex items-end justify-center gap-0">
            <ClickableImage
              path="images.0"
              selected={sel("images.0") || sel("images")}
              onSelectPath={onSelectPath}
              label="تصویر ۱"
              src={images[0]}
              className="relative z-[1] h-40 w-36"
              imgClassName="rounded-2xl"
            />
            <ClickableImage
              path="images.1"
              selected={sel("images.1") || sel("images")}
              onSelectPath={onSelectPath}
              label="تصویر ۲"
              src={images[1]}
              className="relative -mr-8 h-32 w-28"
              imgClassName="rounded-2xl"
            />
          </div>
          <div>
            <Hotspot path="eyebrow" selected={sel("eyebrow")} onSelect={onSelectPath} label="eyebrow">
              <p className="text-[#F3CC30]">{str(payload.eyebrow)}</p>
            </Hotspot>
            <Hotspot path="title" selected={sel("title")} onSelect={onSelectPath} label="عنوان">
              <p className="mt-2 text-xl font-extrabold">{str(payload.title)}</p>
            </Hotspot>
            <div className="mt-5 space-y-3">
              {(items.length ? items : [{ title: "نمونه سوال" }]).map((item, i) => (
                <Hotspot
                  key={i}
                  path={`items.${i}`}
                  selected={sel(`items.${i}`)}
                  onSelect={onSelectPath}
                  label={`سوال ${i + 1}`}
                >
                  <div
                    className={`rounded-xl px-3 py-3 text-sm ${
                      i === 0 ? "bg-[#F3CC30] text-black" : "bg-[#0B2C28] text-white"
                    }`}
                  >
                    {str(item.title, "سوال")}
                  </div>
                </Hotspot>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (block.type === "page_hero") {
    const title = str(payload.title, "تماس با آگروهوم");
    const accent = str(payload.titleAccent, "آگروهوم");
    const parts = title.split(accent);
    return (
      <div
        className="relative mb-6 flex h-32 items-center overflow-hidden rounded-3xl px-8 text-white md:h-40"
        onClick={() => onSelectPath(null)}
      >
        <Hotspot
          path="image"
          selected={sel("image")}
          onSelect={onSelectPath}
          label="تصویر"
          className="absolute inset-0"
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${imageSrc(payload.image, "/c.jpg")})` }}
          />
          <div className="absolute inset-0 bg-[#002D1E]/70" />
        </Hotspot>
        <Hotspot path="title" selected={sel("title")} onSelect={onSelectPath} label="عنوان">
          <p className="relative z-[1] text-xl font-bold md:text-2xl">
            {parts.length > 1 ? (
              <>
                {parts[0]}
                <Hotspot
                  path="titleAccent"
                  selected={sel("titleAccent")}
                  onSelect={onSelectPath}
                  label="اکسنت"
                  className="inline"
                >
                  <span style={{ color: str(payload.accentColor, "#F4C111") }}>{accent}</span>
                </Hotspot>
                {parts.slice(1).join(accent)}
              </>
            ) : (
              title
            )}
          </p>
        </Hotspot>
      </div>
    );
  }

  if (block.type === "contact_intro") {
    const channels = Array.isArray(payload.channels)
      ? (payload.channels as Array<{ title?: string }>)
      : [];
    return (
      <div className="space-y-4 px-4 py-6" dir="rtl" onClick={() => onSelectPath(null)}>
        <Hotspot path="title" selected={sel("title")} onSelect={onSelectPath} label="عنوان">
          <p className="text-xl font-extrabold">{str(payload.title)}</p>
        </Hotspot>
        <Hotspot path="text" selected={sel("text")} onSelect={onSelectPath} label="متن">
          <p className="text-sm leading-7 text-black/60">{str(payload.text)}</p>
        </Hotspot>
        <Hotspot path="channels" selected={sel("channels")} onSelect={onSelectPath} label="راه‌ها">
          <div className="flex flex-wrap justify-end gap-3 pt-2">
            {(channels.length ? channels : [{ title: "ایمیل" }, { title: "تلفن" }]).map(
              (ch, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-xl bg-[#105238] px-3 py-2 text-xs text-white"
                >
                  {str(ch.title, "راه ارتباطی")}
                </div>
              )
            )}
          </div>
        </Hotspot>
      </div>
    );
  }

  if (block.type === "contact_form") {
    return (
      <div
        className="grid gap-4 px-4 py-6 md:grid-cols-[160px_1fr_160px]"
        dir="rtl"
        onClick={() => onSelectPath(null)}
      >
        <div className="rounded-xl bg-[#105238] p-4 text-center text-white">
          <Hotspot
            path="sidebarEyebrow"
            selected={sel("sidebarEyebrow")}
            onSelect={onSelectPath}
            label="eyebrow"
          >
            <p className="text-sm text-[#F4C111]">{str(payload.sidebarEyebrow, "7 روز هفته")}</p>
          </Hotspot>
          <Hotspot
            path="sidebarTitle"
            selected={sel("sidebarTitle")}
            onSelect={onSelectPath}
            label="عنوان سایدبار"
          >
            <p className="mt-1 text-sm font-extrabold">
              {str(payload.sidebarTitle, "پاسخگوی شما هستیم…")}
            </p>
          </Hotspot>
          <Hotspot
            path="sidebarImage"
            selected={sel("sidebarImage")}
            onSelect={onSelectPath}
            label="تصویر"
          >
            <div className="mx-auto mt-3 h-16 w-16 rounded-lg bg-white/10" />
          </Hotspot>
        </div>
        <div className="rounded-2xl bg-[#F3F3F3] p-4">
          <Hotspot path="formTitle" selected={sel("formTitle")} onSelect={onSelectPath} label="عنوان فرم">
            <p className="font-extrabold">{str(payload.formTitle)}</p>
          </Hotspot>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="h-8 rounded-lg bg-white" />
            <div className="h-8 rounded-lg bg-white" />
            <div className="h-8 rounded-lg bg-white" />
            <div className="h-8 rounded-lg bg-white" />
            <div className="col-span-2 h-16 rounded-lg bg-white" />
          </div>
          <Hotspot
            path="submitLabel"
            selected={sel("submitLabel")}
            onSelect={onSelectPath}
            label="دکمه"
          >
            <span className="mt-2 inline-block rounded-2xl bg-green-800 px-3 py-1.5 text-xs text-white">
              {str(payload.submitLabel, "ارسال پیام")}
            </span>
          </Hotspot>
        </div>
        <Hotspot path="mapEmbedUrl" selected={sel("mapEmbedUrl")} onSelect={onSelectPath} label="نقشه">
          <div className="flex h-full min-h-[120px] items-center justify-center rounded-xl bg-[#dfe8e2] text-xs text-black/50">
            نقشه
          </div>
        </Hotspot>
      </div>
    );
  }

  if (block.type === "about_story") {
    const images = asImageList(payload.images, 4, [
      "/ab1.png",
      "/ab2.png",
      "/ab3.png",
      "/ab4.png",
    ]);
    const cta = (payload.cta as { label?: string } | undefined) || {};
    return (
      <div
        className="grid gap-6 px-4 py-8 md:grid-cols-[220px_1fr]"
        dir="rtl"
        onClick={() => onSelectPath(null)}
      >
        <div className="grid grid-cols-2 gap-2">
          {images.slice(0, 4).map((src, i) => (
            <ClickableImage
              key={i}
              path={`images.${i}`}
              selected={sel(`images.${i}`) || sel("images")}
              onSelectPath={onSelectPath}
              label={`تصویر ${i + 1}`}
              src={src}
              className={i === 0 ? "h-16" : "h-20"}
              imgClassName="rounded-xl"
            />
          ))}
        </div>
        <div className="space-y-3">
          <Hotspot path="eyebrow" selected={sel("eyebrow")} onSelect={onSelectPath} label="eyebrow">
            <p className="text-sm text-black/60">{str(payload.eyebrow, "درباره ما")}</p>
          </Hotspot>
          <Hotspot path="title" selected={sel("title")} onSelect={onSelectPath} label="عنوان">
            <p className="text-xl font-extrabold">{str(payload.title)}</p>
          </Hotspot>
          <Hotspot path="text" selected={sel("text")} onSelect={onSelectPath} label="متن">
            <p className="line-clamp-4 text-sm leading-7 text-black/60">{str(payload.text)}</p>
          </Hotspot>
          <Hotspot path="cta" selected={sel("cta")} onSelect={onSelectPath} label="دکمه">
            <span className="inline-block rounded-2xl bg-[#308060] px-3 py-1.5 text-xs text-white">
              {str(cta.label, "تماس با ما")}
            </span>
          </Hotspot>
        </div>
      </div>
    );
  }

  if (block.type === "about_banner") {
    const cta = (payload.cta as { label?: string } | undefined) || {};
    return (
      <div
        className="relative flex h-28 items-center justify-between overflow-hidden bg-[#105238] px-6 text-white"
        dir="rtl"
        onClick={() => onSelectPath(null)}
      >
        <Hotspot path="image" selected={sel("image")} onSelect={onSelectPath} label="تصویر" className="absolute inset-0">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-40"
            style={{ backgroundImage: `url(${imageSrc(payload.image, "/abb.png")})` }}
          />
        </Hotspot>
        <Hotspot path="title" selected={sel("title")} onSelect={onSelectPath} label="عنوان" className="relative z-[1]">
          <p className="text-sm font-bold md:text-base">{str(payload.title)}</p>
        </Hotspot>
        <Hotspot path="cta" selected={sel("cta")} onSelect={onSelectPath} label="دکمه" className="relative z-[1]">
          <span className="rounded-2xl bg-[#F7DB5E] px-3 py-1.5 text-xs text-black">
            {str(cta.label, "شروع کنید!")}
          </span>
        </Hotspot>
      </div>
    );
  }

  if (block.type === "about_services") {
    const items = Array.isArray(payload.items)
      ? (payload.items as Array<{ title?: string }>)
      : [];
    return (
      <div className="space-y-4 px-4 py-8" dir="rtl" onClick={() => onSelectPath(null)}>
        <Hotspot path="title" selected={sel("title")} onSelect={onSelectPath} label="عنوان">
          <p className="text-lg font-extrabold">{str(payload.title, "خدمات مشتریان")}</p>
        </Hotspot>
        <Hotspot path="items" selected={sel("items")} onSelect={onSelectPath} label="آیتم‌ها">
          <div className="grid gap-3 md:grid-cols-2">
            {(items.length ? items : [{ title: "خدمت ۱" }, { title: "خدمت ۲" }]).map((item, i) => (
              <div key={i} className="rounded-2xl bg-[#F5F5F5] px-4 py-3 text-sm font-semibold">
                {str(item.title, `خدمت ${i + 1}`)}
              </div>
            ))}
          </div>
        </Hotspot>
      </div>
    );
  }

  if (isEntityQueryBlock(block.type)) {
    const entity = (
      payload.entity && typeof payload.entity === "string"
        ? payload.entity
        : defaultEntityForBlockType(block.type)
    ) as EntityType;
    const limitHint = Math.min(6, Math.max(3, Number(payload.limit) || 4));

    if (entity === "blog_category") {
      return (
        <div className="px-6 py-12" onClick={() => onSelectPath(null)}>
          <div className="mb-6 text-center">
            <Hotspot path="eyebrow" selected={sel("eyebrow")} onSelect={onSelectPath} label="eyebrow">
              <p className="text-sm">{str(payload.eyebrow)}</p>
            </Hotspot>
            <Hotspot path="title" selected={sel("title")} onSelect={onSelectPath} label="عنوان">
              <p className="mt-1 text-xl font-extrabold">{str(payload.title)}</p>
            </Hotspot>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`relative overflow-hidden rounded-2xl bg-gradient-to-t from-black/80 to-[#6b8f6e] ${
                  i === 1 ? "h-28" : "row-span-2 h-56"
                }`}
              />
            ))}
          </div>
        </div>
      );
    }

    if (entity === "comment") {
      return (
        <div className="bg-[#E9F2EA] px-6 py-12" onClick={() => onSelectPath(null)}>
          <Hotspot path="title" selected={sel("title")} onSelect={onSelectPath} label="عنوان">
            <p className="mb-6 text-xl font-extrabold whitespace-pre-line">
              {str(payload.title, "نظرات و رضایت مشتریان")}
            </p>
          </Hotspot>
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: Math.min(limitHint, 4) }).map((_, i) => (
              <div key={i} className="h-[140px] w-[200px] shrink-0 rounded-[2rem] bg-white p-4" />
            ))}
          </div>
        </div>
      );
    }

    if (entity === "blog") {
      return (
        <div className="px-6 py-12" onClick={() => onSelectPath(null)}>
          <div className="mb-6">
            <Hotspot path="eyebrow" selected={sel("eyebrow")} onSelect={onSelectPath} label="eyebrow">
              <p className="text-sm">{str(payload.eyebrow)}</p>
            </Hotspot>
            <Hotspot path="title" selected={sel("title")} onSelect={onSelectPath} label="عنوان">
              <p className="text-xl font-extrabold">{str(payload.title)}</p>
            </Hotspot>
          </div>
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: Math.min(limitHint, 4) }).map((_, i) => (
              <div key={i} className="w-[180px] shrink-0 rounded-xl bg-[#F8F8F8] p-3">
                <div className="mb-3 aspect-[4/3] rounded-lg bg-gradient-to-br from-[#d7e0d2] to-[#eef2ea]" />
                <div className="h-3 w-3/4 rounded bg-black/10" />
              </div>
            ))}
          </div>
        </div>
      );
    }

    // product | product_category | پیش‌فرض
    return (
      <div className="relative py-10" onClick={() => onSelectPath(null)}>
        <div className="mb-6 flex items-center justify-between px-6">
          <div>
            <Hotspot path="eyebrow" selected={sel("eyebrow")} onSelect={onSelectPath} label="eyebrow">
              <p className="text-sm">{str(payload.eyebrow)}</p>
            </Hotspot>
            <Hotspot path="title" selected={sel("title")} onSelect={onSelectPath} label="عنوان">
              <p className="text-xl font-extrabold">{str(payload.title)}</p>
            </Hotspot>
          </div>
        </div>
        <div className="relative px-6 pt-8">
          <div className="absolute inset-x-0 top-0 h-[140px] bg-green-950/70" />
          <div className="relative flex gap-3 overflow-hidden">
            {Array.from({ length: Math.min(limitHint, 5) }).map((_, i) => (
              <div
                key={i}
                className="w-[150px] shrink-0 overflow-hidden rounded-xl border border-[#E8E8E8] bg-white"
              >
                <div className="aspect-square bg-gradient-to-br from-[#d7e0d2] to-[#eef2ea]" />
                <div className="space-y-1 p-2">
                  <div className="h-2.5 w-2/3 rounded bg-black/10" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (block.type === "rich_text") {
    return (
      <div className="space-y-3 px-8 py-12" onClick={() => onSelectPath(null)}>
        <Hotspot path="title" selected={sel("title")} onSelect={onSelectPath} label="عنوان">
          <h3 className="text-xl font-semibold">{str(payload.title) || "عنوان"}</h3>
        </Hotspot>
        <Hotspot path="text" selected={sel("text")} onSelect={onSelectPath} label="متن">
          <p className="whitespace-pre-wrap leading-8 text-black/80">
            {str(payload.text, "متن این بخش…")}
          </p>
        </Hotspot>
      </div>
    );
  }

  return (
    <div
      className={`px-8 py-12 ${sectionSelected ? "ring-2 ring-inset ring-[var(--admin-accent)]" : ""}`}
      onClick={() => onSelectPath(null)}
    >
      <div className="rounded-xl border border-dashed border-black/15 bg-[#faf8f5] p-6">
        <div className="mb-2 flex items-center gap-2">
          <Badge variant="muted">{blockTypeLabel(block.type)}</Badge>
          {!block.isVisible ? (
            <EyeOff className="h-3.5 w-3.5 text-black/40" />
          ) : (
            <Eye className="h-3.5 w-3.5 text-black/40" />
          )}
        </div>
        <Hotspot path="title" selected={sel("title")} onSelect={onSelectPath} label="عنوان">
          <h3 className="font-semibold">{str(payload.title || block.name, "بخش")}</h3>
        </Hotspot>
      </div>
    </div>
  );
}
