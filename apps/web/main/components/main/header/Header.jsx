'use client';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import React, { Suspense } from 'react';
import NavBar from '../../main/header/NavBar.jsx';
import Search from '../../main/header/Search.jsx';
import { FaPhone } from 'react-icons/fa';
import Link from 'next/link.js';
import { useIsMobile } from '../../../utils/UseIsMobile.tsx'
import MobileMenu from './MobileMenu.jsx';


const Header = ({ product_category }) => {
    const pathname = usePathname()
    const isHome = pathname === '/';
    const isMobile = useIsMobile(766)


    return (
        <header className='max-w-7xl  xl:justify-between z-50   flex xl:gap-5 gap-2 items-center lg:mx-auto md:mx-3 md:h-[45px] h-[50px]   md:mt-10  '>


            <div className={` ${!isHome ? 'bg-[#105238]!' : ''} z-50  glass-card static! justify-between md:justify-start rounded-none! md:rounded-3xl! flex items-center gap-4 h-full w-full  xl:w-[50%] md:px-8 px-3 `}>

                <MobileMenu />

                <Link href={'/'}>
                <Image
                    className='xl:w-[140px] w-[100px] justify-self-end!'
                    src={'/logo.png'} width={150} height={30} alt='logo-header' />
                </Link>
                {<span className='h-5 hidden  md:block w-px bg-gray-200' ></span>}
                {isMobile ? '' : <NavBar product_category={product_category} />}
            </div>
            {isMobile ? '' : <div className=' items-center hidden md:flex gap-4 xl:w-[50%] h-full'>
                <Suspense fallback={<div></div>}>
                <Search isHome={isHome} />
                </Suspense>
                <Link href={'/contact'} className='bg-[#F4C111] hidden xl:flex  items-center w-[140px]  h-full px-4 text-sm rounded-3xl border font-bold border-white'>
                    <FaPhone className='inline ms-2' />
                    تماس با ما
                </Link>
            </div>}
        </header>
    );
};

export default Header;