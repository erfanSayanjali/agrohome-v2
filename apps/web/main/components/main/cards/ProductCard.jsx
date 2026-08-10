'use client';

import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import Skeleton from '@mui/material/Skeleton';
import { mediaUrl } from '../../../lib/data/stubs';

const ProductCard = ({ title, category, image, slug, loading = false }) => {
    
    // اگر loading باشه، کل کارت رو اسکلتون می‌زنیم
    if (loading) {
        return (
            <div className='md:w-[230px] w-40 p-3 h-[310px] flex flex-col bg-white rounded-2xl border-2 border-[#E8E8E8]'>
                <Skeleton
                    variant="rectangular"
                    width={200}
                    height={170}
                    className="rounded-lg md:w-full! w-[130px]!"
                />
                <Skeleton
                    variant="text"
                    width="80%"
                    height={28}
                    className="mt-5"
                />
                <Skeleton
                    variant="text"
                    width="40%"
                    height={22}
                    className="mt-2"
                />
            </div>
        );
    }

    // حالت عادی
    return (
        <Link
            href={'/product/' + (slug || title)}
            className='md:w-[230px] w-40 p-3 md:h-[310px] h-[260px] group flex bg-white transition-all duration-700 flex-col rounded-2xl border-2 border-[#E8E8E8]'
        >
            <Image
                className='w-full scale-95 group-hover:scale-100 transition-all h-[170px] object-contain self-center'
                alt={image?.[0]?.alt || 'image'}
                width={230}
                height={170}
                src={image ? mediaUrl(image) : '/cod1.png'}
            />
            <p className='font-extrabold mt-5 line-clamp-2'>{title}</p>
            <p className='text-shadow-gray-600 text-sm mt-2 line-clamp-1'>{category} </p>
        </Link>
    );
};

export default ProductCard;
