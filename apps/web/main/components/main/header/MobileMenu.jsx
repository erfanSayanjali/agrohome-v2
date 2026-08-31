'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Portal from '../modules/Portal';
import { mediaUrl } from '../../../lib/data/stubs';
import { productCategoryHref } from '../../../utils/paths';
import { CgClose } from 'react-icons/cg';
import { FaPhone, FaLeaf, FaHome, FaBlog, FaInfoCircle } from 'react-icons/fa';
import { IoIosArrowDown, IoIosArrowBack } from 'react-icons/io';
import { HiOutlineMail } from 'react-icons/hi';

const menuSvg = (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      opacity="0.4"
      d="M15.417 3.3335H12.917C12.0837 3.3335 11.667 3.75016 11.667 4.5835V7.0835C11.667 7.91683 12.0837 8.3335 12.917 8.3335H15.417C16.2503 8.3335 16.667 7.91683 16.667 7.0835V4.5835C16.667 3.75016 16.2503 3.3335 15.417 3.3335Z"
      fill="white"
    />
    <path
      opacity="0.4"
      d="M7.08301 3.3335H4.58301C3.74967 3.3335 3.33301 3.75016 3.33301 4.5835V7.0835C3.33301 7.91683 3.74967 8.3335 4.58301 8.3335H7.08301C7.91634 8.3335 8.33301 7.91683 8.33301 7.0835V4.5835C8.33301 3.75016 7.91634 3.3335 7.08301 3.3335Z"
      fill="white"
    />
    <path
      d="M15.417 11.667H12.917C12.0837 11.667 11.667 12.0837 11.667 12.917V15.417C11.667 16.2503 12.0837 16.667 12.917 16.667H15.417C16.2503 16.667 16.667 16.2503 16.667 15.417V12.917C16.667 12.0837 16.2503 11.667 15.417 11.667Z"
      fill="white"
    />
    <path
      opacity="0.4"
      d="M7.08301 11.667H4.58301C3.74967 11.667 3.33301 12.0837 3.33301 12.917V15.417C3.33301 16.2503 3.74967 16.667 4.58301 16.667H7.08301C7.91634 16.667 8.33301 16.2503 8.33301 15.417V12.917C8.33301 12.0837 7.91634 11.667 7.08301 11.667Z"
      fill="white"
    />
  </svg>
);

const DEFAULT_HEADER_LINKS = [
  { href: '/', title: 'صفحه اصلی' },
  { href: '/products', title: 'محصولات' },
  { href: '/blogs', title: 'وبلاگ' },
  { href: '/about', title: 'درباره ما' },
  { href: '/contact', title: 'تماس با ما' },
];

const NAV_ICONS = {
  '/': FaHome,
  '/blogs': FaBlog,
  '/about': FaInfoCircle,
  '/contact': HiOutlineMail,
  '/products': FaLeaf,
};

const isProductsHref = (href = '') =>
  href === '/products' || href.startsWith('/products?');

const catKey = (cat) => cat?._id || cat?.id || cat?.slug || cat?.title;

const categoryHref = (...segments) => `${productCategoryHref(...segments)}?page=1`;

const MobileMenu = ({ product_category = [], logoUrl, headerLinks }) => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [openCatId, setOpenCatId] = useState(null);
  const [openSubId, setOpenSubId] = useState(null);
  const logo = mediaUrl(logoUrl) || '/logo.png';
  const links =
    Array.isArray(headerLinks) && headerLinks.length
      ? headerLinks
      : DEFAULT_HEADER_LINKS;
  const cta =
    links.find((item) => item?.href === '/contact') || {
      title: 'تماس با ما',
      href: '/contact',
    };

  const closeMenu = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
      setProductsOpen(false);
      setOpenCatId(null);
      setOpenSubId(null);
    }, 280);
  };

  const closeInstant = () => {
    setIsOpen(false);
    setIsClosing(false);
    setProductsOpen(false);
    setOpenCatId(null);
    setOpenSubId(null);
  };

  const openMenu = () => {
    setIsClosing(false);
    setIsOpen(true);
  };

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') closeMenu();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isClosing]);

  useEffect(() => {
    closeInstant();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const isActive = (href) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const productsActive = pathname.startsWith('/products');

  return (
    <>
      <button
        type="button"
        aria-label="باز کردن منو"
        onClick={openMenu}
        className="bg-[#308060] hover:bg-[#105238] transition-colors p-1 rounded-lg w-[34px] h-[34px] md:hidden flex items-center justify-center shadow-sm"
      >
        {menuSvg}
      </button>

      {isOpen && (
        <Portal>
          <div className="fixed inset-0 z-[9999] md:hidden" role="dialog" aria-modal="true">
            <div
              onClick={closeMenu}
              className={`absolute inset-0 bg-[#0B3D2C]/55 backdrop-blur-[2px] ${
                isClosing ? 'animate-menuFadeOut' : 'animate-menuFadeIn'
              }`}
            />

            <aside
              className={`
                absolute right-0 top-0 h-full w-[min(86vw,340px)]
                flex flex-col overflow-hidden
                bg-[#f7faf8] shadow-[-12px_0_40px_rgba(16,82,56,0.18)]
                ${isClosing ? 'animate-slideOut' : 'animate-slideIn'}
              `}
            >
              {/* Brand header */}
              <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-[#105238] via-[#1a6b4a] to-[#308060] px-5 pt-5 pb-6 text-white">
                <div
                  className="pointer-events-none absolute -left-10 -top-10 h-36 w-36 rounded-full bg-[#F4C111]/15"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute -bottom-16 -right-8 h-40 w-40 rounded-full bg-white/10"
                  aria-hidden
                />

                <div className="relative flex items-start justify-between gap-3">
                  <Link href="/" onClick={closeInstant} className="block">
                    <Image
                      src={logo}
                      width={130}
                      height={36}
                      alt="لوگو آگروهوم"
                      className="w-[118px] h-auto"
                      unoptimized={String(logo).includes('/uploads/')}
                    />
                  </Link>
                  <button
                    type="button"
                    aria-label="بستن منو"
                    onClick={closeMenu}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 border border-white/25 text-white hover:bg-white/25 transition-colors"
                  >
                    <CgClose size={18} />
                  </button>
                </div>

                <p className="relative mt-4 text-sm text-white/85 leading-relaxed">
                  فروشگاه آنلاین <span className="text-[#F4C111] font-bold">کودهای خانگی</span>
                </p>
              </div>

              {/* Nav */}
              <nav className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
                <p className="mb-3 px-1 text-[11px] font-bold tracking-wide text-[#308060]/80 uppercase">
                  منوی اصلی
                </p>

                <ul className="flex flex-col gap-1.5">
                  {links.map((item, index) => {
                    const href = item?.href || '#';
                    const title = item?.title || '';
                    if (isProductsHref(href)) {
                      return (
                        <li key={`${href}-${index}`}>
                          <div
                            className={`w-full flex items-center gap-1 rounded-2xl text-sm font-medium transition-all ${
                              productsActive || productsOpen
                                ? 'bg-[#DDF4EA] text-[#105238]'
                                : 'text-[#1a3d30] hover:bg-white'
                            }`}
                          >
                            <Link
                              href={href}
                              onClick={closeInstant}
                              className="flex flex-1 items-center gap-3 rounded-2xl px-3.5 py-3"
                            >
                              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F4C111]/25 text-[#105238]">
                                <FaLeaf size={15} />
                              </span>
                              <span className="flex-1 text-right">{title}</span>
                            </Link>
                            <button
                              type="button"
                              aria-label="باز کردن دسته‌بندی محصولات"
                              onClick={() => setProductsOpen((v) => !v)}
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ml-1"
                            >
                              <IoIosArrowDown
                                className={`transition-transform duration-300 ${productsOpen ? 'rotate-180' : ''}`}
                                size={16}
                              />
                            </button>
                          </div>

                          <div
                            className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                              productsOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                            }`}
                          >
                            <div className="overflow-hidden">
                              <div className="mt-1 mr-2 border-r-2 border-[#F4C111]/70 pr-2 space-y-1 pb-1">
                                <Link
                                  href={href}
                                  onClick={closeInstant}
                                  className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors ${
                                    pathname === '/products'
                                      ? 'bg-[#105238] text-white'
                                      : 'text-[#2a5544] hover:bg-white'
                                  }`}
                                >
                                  همه محصولات
                                  <IoIosArrowBack size={14} className="opacity-60" />
                                </Link>

                                {product_category?.map((category) => {
                                  const key = catKey(category);
                                  const catOpen = openCatId === key;
                                  const hasChildren = category.children?.length > 0;
                                  return (
                                    <div key={key}>
                                      <div className="flex items-center gap-1">
                                        <Link
                                          href={categoryHref(category.slug)}
                                          onClick={closeInstant}
                                          className="flex-1 rounded-xl px-3 py-2.5 text-sm text-[#2a5544] hover:bg-white transition-colors"
                                        >
                                          {category.title}
                                        </Link>
                                        {hasChildren && (
                                          <button
                                            type="button"
                                            aria-label={`زیرمجموعه‌های ${category.title}`}
                                            onClick={() => {
                                              setOpenCatId(catOpen ? null : key);
                                              setOpenSubId(null);
                                            }}
                                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#308060] hover:bg-white"
                                          >
                                            <IoIosArrowDown
                                              className={`transition-transform duration-250 ${
                                                catOpen ? 'rotate-180' : ''
                                              }`}
                                              size={14}
                                            />
                                          </button>
                                        )}
                                      </div>

                                      {hasChildren && (
                                        <div
                                          className={`grid transition-[grid-template-rows] duration-250 ${
                                            catOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                                          }`}
                                        >
                                          <div className="overflow-hidden">
                                            <ul className="mr-3 mb-1 space-y-0.5 border-r border-[#105238]/15 pr-2">
                                              {category.children.map((sub) => {
                                                const subKey = catKey(sub);
                                                const subOpen = openSubId === subKey;
                                                const hasGrandChildren =
                                                  sub.children?.length > 0;
                                                return (
                                                  <li key={subKey}>
                                                    <div className="flex items-center gap-1">
                                                      <Link
                                                        href={categoryHref(
                                                          category.slug,
                                                          sub.slug
                                                        )}
                                                        onClick={closeInstant}
                                                        className="flex-1 rounded-lg px-2.5 py-2 text-xs font-medium text-[#2a5544] hover:bg-[#F4C111]/20 hover:text-[#105238] transition-colors"
                                                      >
                                                        {sub.title}
                                                      </Link>
                                                      {hasGrandChildren && (
                                                        <button
                                                          type="button"
                                                          aria-label={`زیرمجموعه‌های ${sub.title}`}
                                                          onClick={() =>
                                                            setOpenSubId(
                                                              subOpen ? null : subKey
                                                            )
                                                          }
                                                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#308060] hover:bg-white"
                                                        >
                                                          <IoIosArrowDown
                                                            className={`transition-transform duration-250 ${
                                                              subOpen ? 'rotate-180' : ''
                                                            }`}
                                                            size={12}
                                                          />
                                                        </button>
                                                      )}
                                                    </div>

                                                    {hasGrandChildren && (
                                                      <div
                                                        className={`grid transition-[grid-template-rows] duration-250 ${
                                                          subOpen
                                                            ? 'grid-rows-[1fr]'
                                                            : 'grid-rows-[0fr]'
                                                        }`}
                                                      >
                                                        <div className="overflow-hidden">
                                                          <ul className="mr-2 mb-1 space-y-0.5 border-r border-[#F4C111]/50 pr-2">
                                                            {sub.children.map((leaf) => (
                                                              <li key={catKey(leaf)}>
                                                                <Link
                                                                  href={categoryHref(
                                                                    category.slug,
                                                                    sub.slug,
                                                                    leaf.slug
                                                                  )}
                                                                  onClick={closeInstant}
                                                                  className="block rounded-md px-2 py-1.5 text-[11px] text-[#6b8578] hover:bg-white hover:text-[#105238] transition-colors"
                                                                >
                                                                  {leaf.title}
                                                                </Link>
                                                              </li>
                                                            ))}
                                                          </ul>
                                                        </div>
                                                      </div>
                                                    )}
                                                  </li>
                                                );
                                              })}
                                            </ul>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    }

                    const Icon = NAV_ICONS[href] || FaInfoCircle;
                    const active = isActive(href);
                    return (
                      <li key={`${href}-${index}`}>
                        <Link
                          href={href}
                          onClick={closeInstant}
                          className={`flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium transition-all ${
                            active
                              ? 'bg-[#105238] text-white shadow-md shadow-[#105238]/20'
                              : 'text-[#1a3d30] hover:bg-white'
                          }`}
                        >
                          <span
                            className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                              active ? 'bg-white/15' : 'bg-[#DDF4EA] text-[#105238]'
                            }`}
                          >
                            <Icon size={15} />
                          </span>
                          {title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              {/* Footer CTA */}
              <div className="shrink-0 border-t border-[#105238]/10 bg-white px-4 py-4">
                <Link
                  href={cta.href || '/contact'}
                  onClick={closeInstant}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#F4C111] text-[#105238] text-sm font-bold shadow-sm hover:brightness-105 active:scale-[0.98] transition-all"
                >
                  <FaPhone size={13} />
                  {cta.title || 'تماس با ما'}
                </Link>
                <p className="mt-3 text-center text-[11px] text-[#6b8578]">
                  آگروهوم — رشد سبز، خانه هوشمند
                </p>
              </div>
            </aside>
          </div>
        </Portal>
      )}
    </>
  );
};

export default MobileMenu;
