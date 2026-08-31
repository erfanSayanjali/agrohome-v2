'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { IoIosArrowBack } from 'react-icons/io';
import { FaLeaf } from 'react-icons/fa';
import { productCategoryHref } from '../../../utils/paths';

const catKey = (cat) => cat?._id || cat?.id || cat?.slug || cat?.title;

const categoryHref = (...segments) => `${productCategoryHref(...segments)}?page=1`;

const CategoryDesktop = ({ categories = [], label = 'محصولات' }) => {
  const panelId = useId();
  const closeTimer = useRef(null);
  const openTimer = useRef(null);
  const [open, setOpen] = useState(false);
  const [activeRoot, setActiveRoot] = useState(null);

  const roots = Array.isArray(categories) ? categories : [];
  const current =
    roots.find((c) => catKey(c) === catKey(activeRoot)) || roots[0] || null;
  const subs = current?.children || [];
  const title = label || 'محصولات';

  const clearTimers = () => {
    clearTimeout(closeTimer.current);
    clearTimeout(openTimer.current);
  };

  const openMenu = () => {
    clearTimers();
    openTimer.current = setTimeout(() => {
      setOpen(true);
      setActiveRoot((prev) => prev || roots[0] || null);
    }, 80);
  };

  const scheduleClose = () => {
    clearTimers();
    closeTimer.current = setTimeout(() => {
      setOpen(false);
    }, 160);
  };

  useEffect(() => {
    if (!roots.length) return;
    if (!activeRoot || !roots.some((c) => catKey(c) === catKey(activeRoot))) {
      setActiveRoot(roots[0]);
    }
  }, [roots, activeRoot]);

  useEffect(() => () => clearTimers(), []);

  if (!roots.length) {
    return (
      <Link href="/products" className="flex h-full items-center gap-2 text-white">
        {title}
      </Link>
    );
  }

  return (
    <div
      className="relative h-full"
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
      onFocus={openMenu}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) scheduleClose();
      }}
    >
      <Link
        href="/products"
        aria-expanded={open}
        aria-controls={panelId}
        className="flex h-full items-center gap-2 text-white"
      >
        {title}
        <svg
          width="7"
          height="5"
          viewBox="0 0 7 5"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden
        >
          <path
            d="M2.74035 4.31433L0.185415 1.28444C-0.243919 0.775194 0.120044 0 0.788544 0H6.21115C6.87965 0 7.24361 0.775778 6.81428 1.28444L4.25935 4.31433C3.86327 4.78391 3.13643 4.78391 2.74035 4.31433Z"
            fill="white"
          />
        </svg>
      </Link>

      {/* پل هاور تا فاصله بین تریگر و پنل منو را نبندد */}
      <div className="absolute inset-x-0 top-full z-[119] h-3" aria-hidden />

      <div
        id={panelId}
        role="menu"
        aria-label="دسته‌بندی محصولات"
        className={`
          absolute top-[calc(100%+8px)] right-0 z-[120]
          w-[min(92vw,720px)] overflow-hidden
          rounded-2xl border border-[#E6EFEA] bg-white
          shadow-[0_18px_50px_rgba(11,61,44,0.16)]
          origin-top-right transition-all duration-200
          ${
            open
              ? 'visible translate-y-0 opacity-100'
              : 'invisible -translate-y-1 opacity-0 pointer-events-none'
          }
        `}
      >
        <div className="flex min-h-[280px] max-h-[min(70vh,520px)]">
          {/* Level 1 */}
          <aside className="w-[220px] shrink-0 border-l border-[#E6EFEA] bg-[#F7FBF8]">
            <div className="border-b border-[#E6EFEA] px-4 py-3">
              <p className="text-[11px] font-bold tracking-wide text-[#308060]">
                دسته‌بندی‌ها
              </p>
            </div>
            <ul className="max-h-[calc(min(70vh,520px)-52px)] overflow-y-auto p-2">
              {roots.map((category) => {
                const active = catKey(category) === catKey(current);
                const hasChildren = category.children?.length > 0;
                return (
                  <li key={catKey(category)}>
                    <div
                      onMouseEnter={() => setActiveRoot(category)}
                      className={`
                        group/item flex items-center gap-1 rounded-xl transition-colors
                        ${
                          active
                            ? 'bg-[#DDF4EA] text-[#105238]'
                            : 'text-[#1f3d31] hover:bg-white'
                        }
                      `}
                    >
                      <Link
                        href={categoryHref(category.slug)}
                        role="menuitem"
                        className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2.5 text-sm font-medium"
                      >
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                            active
                              ? 'bg-[#105238] text-white'
                              : 'bg-white text-[#308060] group-hover/item:bg-[#DDF4EA]'
                          }`}
                        >
                          <FaLeaf size={11} />
                        </span>
                        <span className="truncate">{category.title}</span>
                      </Link>
                      {hasChildren && (
                        <span className="px-2 text-[#308060] opacity-70" aria-hidden>
                          <IoIosArrowBack size={14} />
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </aside>

          {/* Levels 2–3 */}
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center justify-between gap-3 border-b border-[#E6EFEA] px-5 py-3">
              <div>
                <p className="text-sm font-bold text-[#105238]">
                  {current?.title || 'انتخاب دسته‌بندی'}
                </p>
                <p className="mt-0.5 text-xs text-[#6b8578]">
                  {subs.length
                    ? `${subs.length} زیردسته‌بندی`
                    : 'مشاهده محصولات این دسته'}
                </p>
              </div>
              {current?.slug && (
                <Link
                  href={categoryHref(current.slug)}
                  className="inline-flex items-center gap-1 rounded-full bg-[#F4C111]/20 px-3 py-1.5 text-xs font-bold text-[#105238] transition hover:bg-[#F4C111]/35"
                >
                  مشاهده همه
                  <IoIosArrowBack size={12} />
                </Link>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {subs.length ? (
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {subs.map((sub) => {
                    const grandchildren = sub.children || [];
                    return (
                      <li
                        key={catKey(sub)}
                        className="rounded-xl border border-transparent p-2 transition-colors hover:border-[#E6EFEA] hover:bg-[#F7FBF8]"
                      >
                        <Link
                          href={categoryHref(current.slug, sub.slug)}
                          role="menuitem"
                          className="flex items-center justify-between gap-2 border-r-2 border-[#F4C111] pr-2.5 text-sm font-bold text-[#1f3d31] hover:text-[#105238]"
                        >
                          <span className="line-clamp-1">{sub.title}</span>
                          <IoIosArrowBack
                            size={13}
                            className="shrink-0 text-[#308060]/70"
                          />
                        </Link>

                        {grandchildren.length > 0 && (
                          <ul className="mt-1.5 space-y-0.5 pr-3">
                            {grandchildren.map((leaf) => (
                              <li key={catKey(leaf)}>
                                <Link
                                  href={categoryHref(
                                    current.slug,
                                    sub.slug,
                                    leaf.slug
                                  )}
                                  role="menuitem"
                                  className="block rounded-lg px-2 py-1.5 text-xs text-[#4a6b5c] transition-colors hover:bg-[#F4C111]/20 hover:text-[#105238]"
                                >
                                  {leaf.title}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="flex h-full min-h-[180px] flex-col items-center justify-center gap-3 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#DDF4EA] text-[#105238]">
                    <FaLeaf size={18} />
                  </div>
                  <p className="text-sm text-[#4a6b5c]">
                    برای این دسته زیرمجموعه‌ای ثبت نشده است.
                  </p>
                  {current?.slug && (
                    <Link
                      href={categoryHref(current.slug)}
                      className="text-sm font-bold text-[#105238] underline-offset-4 hover:underline"
                    >
                      رفتن به محصولات {current.title}
                    </Link>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-[#E6EFEA] bg-[#F7FBF8] px-5 py-3">
              <Link
                href="/products"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-[#105238] transition hover:text-[#308060]"
              >
                همه محصولات
                <IoIosArrowBack size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryDesktop;
