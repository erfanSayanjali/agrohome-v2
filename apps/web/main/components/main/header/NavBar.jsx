import Link from 'next/link';
import React from 'react';
import CategoryDesktop from './CategoryDesktop';

const NavBar = ({ className, product_category, wrapperClassName }) => {
  return (
    <nav className={`hidden md:flex h-full ${wrapperClassName || ''}`}>
      <ul
        className={`text-white md:flex text-sm hidden items-center gap-5 ${className || ''}`}
      >
        <li>
          <Link href="/">صفحه اصلی</Link>
        </li>
        <li className="h-full flex items-center">
          <CategoryDesktop categories={product_category} />
        </li>
        <li>
          <Link href="/blogs">وبلاگ</Link>
        </li>
        <li>
          <Link href="/about">درباره ما</Link>
        </li>
        <li>
          <Link href="/contact">تماس با ما</Link>
        </li>
      </ul>
    </nav>
  );
};

export default NavBar;
