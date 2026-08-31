'use client';

import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import Skeleton from '@mui/material/Skeleton';
import { mediaUrl } from '../../../lib/data/stubs';

const shellClass = (fullWidth) =>
    `${fullWidth ? 'w-full' : 'w-[148px] sm:w-[180px] md:w-[220px]'} p-2.5 md:p-3 flex flex-col bg-white rounded-xl md:rounded-2xl border-2 border-[#E8E8E8]`;

const ProductCard = ({ title, category, image, slug, loading = false, fullWidth = false }) => {
    if (loading) {
        return (
            <div className={shellClass(fullWidth)}>
                <div className='w-full aspect-[4/3] md:aspect-[230/170] rounded-lg overflow-hidden'>
                    <Skeleton variant="rectangular" width="100%" height="100%" className="h-full!" />
                </div>
                <Skeleton
                    variant="text"
                    width="90%"
                    height={22}
                    className="mt-2.5 md:mt-4"
                />
                <Skeleton
                    variant="text"
                    width="50%"
                    height={18}
                    className="mt-1"
                />
            </div>
        );
    }

    return (
        <Link
            href={'/product/' + (slug || title)}
            className={`${shellClass(fullWidth)} group transition-all duration-500 hover:border-[#308060]/35 hover:shadow-[0_8px_24px_rgba(26,61,57,0.08)]`}
        >
            <div className='relative w-full aspect-[4/3] md:aspect-[230/170] overflow-hidden rounded-lg bg-[#F8F8F8]'>
                <Image
                    className='w-full h-full scale-95 group-hover:scale-100 transition-all object-contain'
                    alt={image?.[0]?.alt || 'image'}
                    width={230}
                    height={170}
                    src={image ? mediaUrl(image) : '/cod1.png'}
                />
            </div>
            <div className='mt-2.5 md:mt-4 flex flex-col gap-0.5 md:gap-1 min-w-0'>
                <p className='font-bold md:font-extrabold text-[13px] md:text-[15px] leading-snug line-clamp-2'>
                    {title}
                </p>
                <p className='text-gray-600 text-xs md:text-sm line-clamp-1'>{category}</p>
            </div>
        </Link>
    );
};

export default ProductCard;
