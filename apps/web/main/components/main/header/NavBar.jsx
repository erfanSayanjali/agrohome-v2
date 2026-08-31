import Link from 'next/link';
import React from 'react';
import CategoryDesktop from './CategoryDesktop';

const DEFAULT_HEADER_LINKS = [
  { title: 'صفحه اصلی', href: '/' },
  { title: 'محصولات', href: '/products' },
  { title: 'وبلاگ', href: '/blogs' },
  { title: 'درباره ما', href: '/about' },
  { title: 'تماس با ما', href: '/contact' },
];

const isProductsHref = (href = '') =>
  href === '/products' || href.startsWith('/products?');

const NavBar = ({ className, product_category, wrapperClassName, headerLinks }) => {
  const links =
    Array.isArray(headerLinks) && headerLinks.length
      ? headerLinks
      : DEFAULT_HEADER_LINKS;

  return (
    <nav className={`relative z-[110] hidden h-full overflow-visible md:flex ${wrapperClassName || ''}`}>
      <ul
        className={`text-white md:flex text-sm hidden h-full items-center gap-5 overflow-visible ${className || ''}`}
      >
        {links.map((item, index) => {
          const href = item?.href || '#';
          const title = item?.title || '';
          if (isProductsHref(href)) {
            return (
              <li
                key={`${href}-${index}`}
                className="relative z-[110] flex h-full items-center overflow-visible"
              >
                <CategoryDesktop categories={product_category} label={title} />
              </li>
            );
          }
          return (
            <li key={`${href}-${index}`}>
              <Link href={href}>{title}</Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default NavBar;
