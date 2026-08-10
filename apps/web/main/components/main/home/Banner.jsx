import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { FaArrowLeft } from 'react-icons/fa';
import { mediaUrl, mediaAlt } from '../../../lib/data/stubs';

const Banner = ({ cms } = {}) => {
    const title = cms?.title || 'زندگی سبز از تو خونه شروع می‌شه!';
    const accent = cms?.titleAccent || 'سبز';
    const text =
        cms?.text ||
        'لورم ایپــــــسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ، و با استفاده از طراحان گرافیک است!';
    const image = mediaUrl(cms?.image) || '/b1.jpg';
    const imageAlt = mediaAlt(cms?.image, title);
    const accentColor = cms?.accentColor || '#F3CC30';
    const cta = cms?.cta || { label: 'کودهای آپارتمانی', href: '/products' };
    const parts = title.split(accent);

    return (
        <div className='md:my-40 my-10 relative h-full md:h-[200px]'>
            <div className='max-w-7xl mx-auto px-3 h-full flex flex-col py-10 md:py-0  max-md:text-center md:flex-row justify-between items-center'>
                <div>
                <p className='text-2xl text-white font-bold  '>
            {parts.length > 1 ? (
              <>
                {parts[0]}
                <span style={{ color: accentColor }}>{accent}</span>
                {parts.slice(1).join(accent)}
              </>
            ) : (
              title
            )}
            </p>
            <p className='text-white mt-2 '>{text}</p>

                </div>
                <Link href={cta.href || '/products'} className=' hover:bg-[#F3CC30] transition-all px-4 flex mt-3 font-extrabold items-center gap-2 bg-white rounded-2xl p-2'>
                {cta.label || 'کودهای آپارتمانی'}
                <FaArrowLeft/>


                </Link>
            </div>
            <Image width={1000} height={200} alt={imageAlt} className='w-full object-cover h-full md:h-[200px] absolute top-0 -z-10'  src={image} unoptimized={String(image).includes('/uploads/')}/>
            <div className='w-full h-full absolute bg-black/40 top-0 -z-10' />
        </div>
    );
};

export default Banner;
