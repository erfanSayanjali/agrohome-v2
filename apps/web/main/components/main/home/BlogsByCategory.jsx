'use client'
import Link from 'next/link';
import React from 'react';
import {motion} from 'framer-motion'
import Image from 'next/image';
import { mediaUrl } from '../../../lib/data/stubs';

const Items = ({ title, description, image, link, className }) => {
  return (
    <Link href={link} className={`w-full  h-[470px] bg-cover relative bg-center  group cursor-pointer overflow-hidden ${className}`}>
      <Image 
      className='absolute h-full object-cover rounded-2xl top-0 w-full'
      src={image} height={500} width={500} alt={title}/>
      <div className='w-full h-full rounded-2xl  top-0 bg-linear-to-t from-black/90 via-black/50 to-transparent -z-10' />
      {title && <div className='absolute bottom-0 flex flex-col gap-2 h-full items-center justify-end w-full'>
        <div className='flex gap-2 pb-5 items-center'>
          <div className='w-[10px] h-[10px] rounded-full  bg-amber-500 flex z-10' />
          <h3 className='text-white font-bold text-xl   '>{title}</h3>
        </div>
        <div className='flex h-0 group-hover:h-[1000px] max-h-[50%] duration-700  flex-col gap-3 text-center text-white px-4 opacity-0 group-hover:opacity-100 transition-all'>
          <p className='opacity-70'>{description}</p>
          <p href={link} className='bg-[#F4C111] p-1 w-fit mx-auto px-3 rounded-lg text-green-950'>مشاهده</p>
        </div>
      </div>}
    </Link>
  )
}


const BlogsByCategory = ({ categories = [], cms } = {}) => {
  const eyebrow = cms?.eyebrow || 'هر گیاهی، کود مخصوص خودش رو می‌خواد!';
  const title = cms?.title || 'راهنمای استفاده بر اساس نوع گیاه';
  const list = Array.isArray(categories) ? categories : [];

  return (
    <div className='max-w-7xl lg:mx-auto mx-3 '>
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
            className={itemClass }
            transition={{ type: 'tween' , duration:'0.8' }}
            key={category._id || index}
            >
              <Items
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
