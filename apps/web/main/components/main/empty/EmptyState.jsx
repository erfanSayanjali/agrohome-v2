'use client';

import Link from 'next/link';
import { MdOutlineKeyboardArrowLeft } from 'react-icons/md';
import { HiOutlineTrash } from 'react-icons/hi2';
import { IoHomeOutline } from 'react-icons/io5';

const ProductArt = ({ searching }) => (
  <svg
    viewBox="0 0 160 160"
    className="h-[132px] w-[132px] md:h-[152px] md:w-[152px]"
    aria-hidden
  >
    <circle cx="80" cy="80" r="72" fill="#E8F1EA" />
    <circle cx="80" cy="80" r="56" fill="#F7FAF6" />
    <ellipse cx="80" cy="118" rx="34" ry="6" fill="#D7E4D8" />
    <path
      d="M58 96c0-4 4-7 10-7h24c6 0 10 3 10 7v10c0 8-8 14-22 14s-22-6-22-14V96z"
      fill="#C9784A"
    />
    <path
      d="M60 96c0-3 3.5-5 8.5-5h23c5 0 8.5 2 8.5 5H60z"
      fill="#A85F38"
    />
    <ellipse cx="80" cy="93" rx="18" ry="5" fill="#6B4A32" />
    <path
      d="M80 92c0-18 1-32 1-42"
      stroke="#2F6B4F"
      strokeWidth="2.4"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M81 62c-12-2-20-12-18-22 12 2 20 12 18 22z"
      fill="#3E8A62"
    />
    <path
      d="M81 58c12-1 21-10 20-20-12 1-21 10-20 20z"
      fill="#4FA276"
    />
    <circle cx="81" cy="48" r="3.2" fill="#F4C111" />
    {searching ? (
      <g>
        <circle
          cx="118"
          cy="46"
          r="16"
          fill="none"
          stroke="#105238"
          strokeWidth="4"
        />
        <path
          d="M130 58l10 10"
          stroke="#105238"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <circle cx="118" cy="46" r="10" fill="#F4C111" opacity="0.35" />
      </g>
    ) : null}
  </svg>
);

const BlogArt = ({ searching }) => (
  <svg
    viewBox="0 0 160 160"
    className="h-[132px] w-[132px] md:h-[152px] md:w-[152px]"
    aria-hidden
  >
    <circle cx="80" cy="80" r="72" fill="#E8F1EA" />
    <circle cx="80" cy="80" r="56" fill="#F7FAF6" />
    <rect x="48" y="42" width="64" height="78" rx="10" fill="#FFFFFF" />
    <rect x="48" y="42" width="8" height="78" rx="4" fill="#F4C111" />
    <rect x="66" y="58" width="34" height="5" rx="2.5" fill="#D5DDD5" />
    <rect x="66" y="70" width="28" height="5" rx="2.5" fill="#D5DDD5" />
    <rect x="66" y="82" width="32" height="5" rx="2.5" fill="#E4EBE4" />
    <path
      d="M92 98c-8 1-14-6-13-14 9-1 15 6 13 14z"
      fill="#3E8A62"
    />
    <path
      d="M92 98c6 2 12-4 11-11-7-1-12 5-11 11z"
      fill="#4FA276"
    />
    {searching ? (
      <g>
        <circle
          cx="118"
          cy="46"
          r="16"
          fill="none"
          stroke="#105238"
          strokeWidth="4"
        />
        <path
          d="M130 58l10 10"
          stroke="#105238"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <circle cx="118" cy="46" r="10" fill="#F4C111" opacity="0.35" />
      </g>
    ) : null}
  </svg>
);

const copyByVariant = {
  products: {
    eyebrow: 'فروشگاه آگروهوم',
    searchTitle: 'محصولی با این جستجو پیدا نشد',
    filterTitle: 'محصولی در این دسته‌بندی نیست',
    emptyTitle: 'هنوز محصولی در این بخش نیست',
    searchHint: (search) =>
      `برای «${search}» نتیجه‌ای پیدا نشد. املا را بررسی کنید یا کلمه کوتاه‌تری بنویسید.`,
    filterHint: (category) =>
      category
        ? `در «${category}» محصولی موجود نیست. فیلتر را بردارید یا دسته دیگری را ببینید.`
        : 'با فیلترهای فعلی محصولی پیدا نشد. فیلترها را حذف کنید یا همه محصولات را ببینید.',
    emptyHint: 'به‌زودی کودهای خانگی جدید به فروشگاه اضافه می‌شود.',
    emptyPrimary: { label: 'بازگشت به صفحه اصلی', href: '/' },
    emptySecondary: { label: 'تماس با ما', href: '/contact' },
    tips: ['کلمه کوتاه‌تری جستجو کنید', 'فیلتر دسته‌بندی را بردارید', 'همه محصولات را ببینید'],
  },
  blogs: {
    eyebrow: 'وبلاگ آگروهوم',
    searchTitle: 'مقاله‌ای با این جستجو پیدا نشد',
    filterTitle: 'مطلبی در این موضوع نیست',
    emptyTitle: 'هنوز مقاله‌ای منتشر نشده',
    searchHint: (search) =>
      `برای «${search}» مطلبی پیدا نشد. عبارت دیگری امتحان کنید یا همه مقالات را ببینید.`,
    filterHint: (category) =>
      category
        ? `در موضوع «${category}» هنوز مطلبی نیست. موضوع دیگری را انتخاب کنید.`
        : 'با فیلترهای فعلی مقاله‌ای پیدا نشد. فیلترها را حذف کنید یا همه مطالب را ببینید.',
    emptyHint: 'به‌زودی مطالب آموزشی باغبانی و کودهای خانگی اینجا می‌آید.',
    emptyPrimary: { label: 'مشاهده محصولات', href: '/products' },
    emptySecondary: { label: 'بازگشت به صفحه اصلی', href: '/' },
    tips: ['عبارت کوتاه‌تری جستجو کنید', 'موضوع دیگری را انتخاب کنید', 'همه مقالات را ببینید'],
  },
};

const EmptyState = ({
  variant = 'products',
  search = '',
  categoryTitle = '',
  hasFilters = false,
  onClearFilters,
}) => {
  const copy = copyByVariant[variant] || copyByVariant.products;
  const searching = Boolean(search);
  const title = searching
    ? copy.searchTitle
    : hasFilters
      ? copy.filterTitle
      : copy.emptyTitle;
  const description = searching
    ? copy.searchHint(search)
    : hasFilters
      ? copy.filterHint(categoryTitle)
      : copy.emptyHint;

  return (
    <section
      role="status"
      aria-live="polite"
      className="relative overflow-hidden rounded-3xl border border-dashed border-[#D5DDD5] bg-linear-to-b from-[#F8FAF7] to-[#F1F5F1] px-5 py-10 text-center md:px-10 md:py-14"
    >
      <div className="pointer-events-none absolute -top-16 -left-10 h-40 w-40 rounded-full bg-[#F4C111]/15" />
      <div className="pointer-events-none absolute -bottom-20 -right-8 h-48 w-48 rounded-full bg-[#308060]/10" />

      <div className="relative mx-auto flex max-w-md flex-col items-center">
        <div className="empty-float">
          {variant === 'blogs' ? (
            <BlogArt searching={hasFilters} />
          ) : (
            <ProductArt searching={hasFilters} />
          )}
        </div>

        <p className="mt-2 flex items-center gap-2 text-[13px] text-[#308060]">
          <span className="inline-block h-[7px] w-[12px] rounded-full bg-[#EAC52E]" />
          {copy.eyebrow}
        </p>

        <h2 className="mt-2 text-lg font-extrabold text-[#353535] md:text-xl">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-7 text-[#5F6B64] md:text-[15px]">
          {description}
        </p>

        <div className="mt-6 flex w-full flex-col items-center justify-center gap-2 sm:flex-row">
          {hasFilters ? (
            <>
              {typeof onClearFilters === 'function' ? (
                <button
                  type="button"
                  onClick={onClearFilters}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#308060] px-4 py-3 text-sm text-white transition-colors hover:bg-[#276b50] sm:w-auto"
                >
                  <HiOutlineTrash size={16} />
                  حذف فیلترها و مشاهده همه
                </button>
              ) : null}
              <Link
                href="/"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#308060]/25 bg-white px-4 py-3 text-sm text-[#1F4D3A] transition-colors hover:border-[#308060]/50 sm:w-auto"
              >
                <IoHomeOutline size={16} />
                صفحه اصلی
              </Link>
            </>
          ) : (
            <>
              <Link
                href={copy.emptyPrimary.href}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#308060] px-4 py-3 text-sm text-white transition-colors hover:bg-[#276b50] sm:w-auto"
              >
                {copy.emptyPrimary.href === '/' ? <IoHomeOutline size={16} /> : null}
                {copy.emptyPrimary.label}
                <MdOutlineKeyboardArrowLeft size={18} />
              </Link>
              <Link
                href={copy.emptySecondary.href}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#F4C111] px-4 py-3 text-sm text-[#1F3A2A] transition-colors hover:bg-[#E5B40A] sm:w-auto"
              >
                {copy.emptySecondary.label}
                <MdOutlineKeyboardArrowLeft size={18} />
              </Link>
            </>
          )}
        </div>

        {hasFilters ? (
          <ul className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {copy.tips.map((tip) => (
              <li
                key={tip}
                className="rounded-full border border-[#E2EAE2] bg-white/80 px-3 py-1.5 text-[11px] text-[#5F6B64]"
              >
                {tip}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
};

export default EmptyState;
