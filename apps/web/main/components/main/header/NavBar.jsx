import Link from 'next/link';
import React from 'react';
import CategoryDesktop from './CategoryDesktop';

const NavBar = ({className , product_category ,wrapperClassName}) => {

    return (
        <nav className={`hidden md:flex h-full ${wrapperClassName || ''}`}>
        <ul className={`text-white md:flex text-sm hidden items-center gap-5 ${className || ''}`}>
            <li>
                <Link
                    href={'/'}
                >
                    صفحه اصلی
                </Link>
            </li>
            <li className='group h-full flex items-center'>
                <Link
                    className='flex items-center gap-2 '
                    href={'/products'}
                >
                    کودهای خانگی
                    <svg width="7" height="5" viewBox="0 0 7 5" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2.74035 4.31433L0.185415 1.28444C-0.243919 0.775194 0.120044 0 0.788544 0H6.21115C6.87965 0 7.24361 0.775778 6.81428 1.28444L4.25935 4.31433C3.86327 4.78391 3.13643 4.78391 2.74035 4.31433Z" fill="white" />
                    </svg>
              
                   
                </Link>
                        <CategoryDesktop categories={product_category}/>
            </li>
            <li>
                <Link
                    href={'/blogs'}
                >
                    وبلاگ
                </Link>
            </li>
            <li>
                <Link
                    href={'/about'}
                >
                    درباره ما
                </Link>
            </li>
            <li>
                <Link
                    href={'/contact'}
                >
                    تماس با ما
                </Link>
            </li>
        </ul>
    </nav>
    );
};

export default NavBar;