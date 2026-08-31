'use client'
import Link from 'next/link';
import React from 'react';
import {motion} from 'framer-motion'
import Image from 'next/image';
import { mediaUrl } from '../../../lib/data/stubs';

const CATEGORY_OVERLAY =
  'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.72) 32%, rgba(0,0,0,0.28) 58%, rgba(0,0,0,0.06) 100%)';

const Items = ({ title, description, image, link, className }) => {
  return (
    <Link
      href={link}
      className={`relative isolate block h-full min-h-[220px] w-full overflow-hidden rounded-2xl group cursor-pointer ${className}`}
    >
      <Image
        fill
        sizes="(max-width: 768px) 100vw, 33vw"
        className="object-cover"
        src={image}
        alt={title || 'دسته وبلاگ'}
      />
      <div
        className="absolute inset-0 z-[1]"
        style={{ background: CATEGORY_OVERLAY }}
        aria-hidden
      />

      {title && (
        <div className="absolute inset-0 z-[2] flex flex-col items-center justify-end">
          <div className="flex w-full items-center justify-center gap-2 px-4 pb-5 pt-16">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-amber-500" aria-hidden />
            <h3 className="text-center text-lg font-bold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)] md:text-xl">
              {title}
            </h3>
          </div>
          <div className="flex h-0 max-h-[50%] w-full flex-col gap-3 overflow-hidden px-4 pb-4 text-center text-white opacity-0 transition-all duration-700 group-hover:h-40 group-hover:opacity-100">
            {description ? (
              <p className="text-sm opacity-95 drop-shadow-[0_1px_6px_rgba(0,0,0,0.9)]">{description}</p>
            ) : null}
            <span className="mx-auto w-fit rounded-lg bg-[#F4C111] px-3 py-1 text-sm font-medium text-green-950">
              مشاهده
            </span>
          </div>
        </div>
      )}
    </Link>
  );
};


const BlogsByCategory = ({ categories = [], cms } = {}) => {
  const eyebrow = cms?.eyebrow || 'هر گیاهی، کود مخصوص خودش رو می‌خواد!';
  const title = cms?.title || 'راهنمای استفاده بر اساس نوع گیاه';
  const list = Array.isArray(categories) ? categories : [];

  return (
    <div className='relative z-10 max-w-7xl lg:mx-auto mx-3 overflow-x-clip min-w-0'>
      <div className='flex lg:flex-row flex-col justify-center text-center items-center mb-6'>
        <div>
          <p className='text-sm md:text-base'>
            {eyebrow}
          </p>
          <p className='md:text-xl mt-1 font-extrabold mb-2 md:mb-0'>
            {title}
          </p>
        </div>
      </div>
      {!list.length ? (
        <p className='rounded-xl bg-[#F8F8F8] p-6 text-center text-sm text-black/60'>
          هنوز دسته‌ای برای این بخش پیدا نشد.
        </p>
      ) : (
      <div className='lg:grid flex flex-col grid-cols-3 grid-flow-col row-span-2 gap-5 w-full '>
        {list.map((category, index) => {
          const isFirst = index === 0;
          const isTop = index === 1;
          const isEnd = list.length - 1 === index
          let initial;
          let whileInView;
          if(isFirst || isEnd){
            initial =  { opacity: 0, translateX: isFirst ? 50 : -50 }
            whileInView = {opacity:100 , translateX: 0}
          }else if(isTop){
            initial =  { opacity: 0, translateY: -50 }
            whileInView = {opacity:100 , translateY: 0}
          }else{
            initial =  { opacity: 0, translateY: 50 }
            whileInView = {opacity:100 , translateY: 0}
          }
          const itemClass = isFirst || isEnd
            ? 'row-span-2 max-lg:h-[calc(450px/2)]!  '
            : 'h-[calc(450px/2)]!';

          return (
            <motion.div
            viewport={{ once: true }}
            initial={initial}
            whileInView={whileInView}
            className={`relative h-full w-full ${itemClass}`}
            transition={{ type: 'tween' , duration:'0.8' }}
            key={category._id || index}
            >
              <Items
              className="h-[470px] max-lg:h-[225px]"
              link={`/blogs/${category.slug}`}
              title={category.title}
              
              image={mediaUrl(category.thumbnail_id?.[0]?.url) || '/blog1.png'}
            />
            </motion.div>
          );
        })}
      </div>
      )}

    </div>
  );
};

export default BlogsByCategory;
