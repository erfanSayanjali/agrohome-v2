import Image from 'next/image';
import React from 'react';
import { IoMdArrowDropleft } from "react-icons/io";
import { FaCalendarDays } from "react-icons/fa6";
import { IoIosArrowRoundBack } from "react-icons/io";
import Link from 'next/link';
import { mediaUrl } from '../../../lib/data/stubs';

const BlogCard = ({ data, className = '' }) => {
    const imageURL = data?.thumbnail_id?.[0]?.url 
    return (
        <Link href={`/blog/${data?.slug}`} className={`w-[260px] sm:w-[280px] h-[375px] bg-[#F8F8F8] rounded-2xl overflow-hidden flex flex-col p-5 relative ${className}`}>
            <Image src={ imageURL ? mediaUrl(imageURL) : '/blog1.png'} width={240} height={140} alt={data?.title || 'بلاگ'} className='w-full h-[170px] object-cover rounded-2xl' />
            <p className='flex line-clamp-2 items-start  mt-3 text-base font-semibold'>
                <IoMdArrowDropleft fontSize={22} color='#B7B7B7' />
                {
                    data?.title
                }
            </p>
            <p className='mt-2 line-clamp-3 text-sm text-justify text-gray-600'>
                {
                    data?.subTitle
                }            </p>
            <div className='flex items-center justify-self-end absolute bottom-5 w-[85%] justify-between mt-2'>
                <div className='flex items-center  gap-2'>
                    <FaCalendarDays fontSize={15} className='text-gray-600' />
                    <span className='text-sm text-gray-500  mt-1 justify-self-start w-fit'>
                        {new Date(data?.createdAt || '').toLocaleDateString('fa-IR')}
                    </span>
                </div>

                <IoIosArrowRoundBack className='justify-self-end box-content p-1 rounded-full bg-gray-400' color='#fff' fontSize={20} />


            </div>
        </Link>
    );
};

export default BlogCard;
