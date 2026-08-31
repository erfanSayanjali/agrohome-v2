'use client';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import React, { Suspense } from 'react';
import NavBar from '../../main/header/NavBar.jsx';
import Search from '../../main/header/Search.jsx';
import { FaPhone } from 'react-icons/fa';
import Link from 'next/link.js';
import MobileMenu from './MobileMenu.jsx';
import { mediaUrl } from '../../../lib/data/stubs';

const DEFAULT_HEADER_LINKS = [
  { title: 'صفحه اصلی', href: '/' },
  { title: 'محصولات', href: '/products' },
  { title: 'وبلاگ', href: '/blogs' },
  { title: 'درباره ما', href: '/about' },
  { title: 'تماس با ما', href: '/contact' },
];

const Header = ({ product_category, logoUrl, headerLinks }) => {
    const pathname = usePathname()
    const isHome = pathname === '/';
    const logo = mediaUrl(logoUrl) || '/logo.png'
    const links =
      Array.isArray(headerLinks) && headerLinks.length
        ? headerLinks
        : DEFAULT_HEADER_LINKS;
    const cta =
      links.find((item) => item?.href === '/contact') || {
        title: 'تماس با ما',
        href: '/contact',
      };


    return (
        <header className='relative z-[100] max-w-7xl w-full justify-between flex xl:gap-5 gap-2 items-center lg:mx-auto md:mx-3 md:h-[45px] h-[50px] md:mt-10 overflow-visible'>


            <div className={`relative z-[100] overflow-visible justify-between rounded-none md:rounded-3xl flex items-center gap-5 h-full w-full md:w-fit md:px-6 px-3 ${!isHome ? 'bg-[#105238]' : ''}`}>
                {/* لایه blur جداست تا backdrop-filter مگامنو را clip نکند */}
                {isHome ? (
                    <div className='glass-card pointer-events-none absolute inset-0 -z-10 rounded-none md:rounded-3xl' aria-hidden />
                ) : null}

                <MobileMenu
                  product_category={product_category}
                  logoUrl={logoUrl}
                  headerLinks={links}
                />

                <div className="relative z-[110] flex h-full items-center gap-5 overflow-visible">
                    <Link href={'/'}>
                    <Image
                        className='xl:w-[140px] w-[100px]'
                        src={logo} width={150} height={30} alt='logo-header'
                        unoptimized={String(logo).includes('/uploads/')} />
                    </Link>
                    <span className='h-5 hidden  md:block w-px bg-gray-200' ></span>
                    <NavBar
                      product_category={product_category}
                      headerLinks={links}
                    />
                </div>
            </div>
            <div className='items-center hidden md:flex gap-4 flex-1 h-full'>
                <Suspense fallback={<div></div>}>
                <Search isHome={isHome} />
                </Suspense>
                <Link href={cta.href || '/contact'} className='bg-[#F4C111] hidden xl:flex items-center justify-center gap-2 shrink-0 h-full px-5 text-sm rounded-3xl border font-bold border-white'>
                    <FaPhone className='inline' />
                    {cta.title || 'تماس با ما'}
                </Link>
            </div>
        </header>
    );
};

export default Header;
