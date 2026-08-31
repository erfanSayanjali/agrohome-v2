import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { FaStar } from 'react-icons/fa';
import { mediaUrl } from '../../../lib/data/stubs';
import { productCategoryHref } from '../../../utils/paths';

const FeatureItem = ({title , value}) => {
    return (
        <div className='bg-white p-3 rounded-lg flex flex-col gap-1'>
           <p>{title}</p>
           <p className='text-[#1A1A1A]'>{value}</p>
        </div>
    );
}
const unitRegister = {l:'لیتر',g:'گرم',ml:'میلی لیتر' ,kg:'کیلوگرم'}
const Info = ({slug , data ,specification}) => {
    const spec = (Array.isArray(specification) ? specification : []).filter((item) => (
        item?.highlight && item?.specification_id?.position === 'attribute'
    ))
    const package_ids = Array.isArray(data?.package_ids) ? data.package_ids : []
    const categories = Array.isArray(data?.category_id) ? data.category_id : []

    return (
        <div className='bg-[#F0F0F0]  rounded-3xl grid  lg:flex justify-between flex-col lg:flex-row gap-5'>
        <div className='p-5'>
        <div className='text-sm text-gray-600 mb-2'>
            <Link href={'/'} className='cursor-pointer hover:underline'>خانه</Link> / <Link href={'/products'} className='cursor-pointer hover:underline'>محصولات</Link>
                  {
                    categories.map((item,i)=>{
                        if (!item?.slug && !item?.title) return null;
                        return (
                          <span key={item._id || item.slug || i}>
                            {' / '}
                            <Link className='cursor-pointer hover:underline' href={`${productCategoryHref(item.slug)}?sort=newest`}>
                              {item.title}
                            </Link>
                          </span>
                        )
                    })
                  }
                  {data?.title ? <> / <span>{data.title}</span></> : null}
                    </div>
        <div className='flex items-center mb-3 gap-1'>
            <FaStar className='inline text-yellow-400 me-1'/>
            <p className='text-sm text-gray-600'>
                <span className='md:text-lg! font-extrabold'>4.5</span> رضایت کالا
            </p>
        </div>
        <h1 className='md:text-lg font-extrabold'>{data.title}</h1>
        <p className='my-2 text-justify line-clamp-3 text-gray-700'>
            {data.subTitle}
        </p>
        {package_ids.length ? (
        <div>
            <p className='font-extrabold md:text-lg col-span-full'>بسته‌بندی:</p>
        <div className='flex flex-wrap mt-2 gap-3'>
            {
                package_ids.map(item=>{
                    return(                        
                        <div key={item._id || item.id} className='bg-white p-3 rounded-lg flex  gap-1'>
                        <p className='text-[#1A1A1A]'>{item.value}</p>
                        
                        <p>{unitRegister[item.unit] || item.unit}</p>
                     </div>
                    )
                })
            }
        </div>
        </div>
        ) : null}
        {spec.length ? (
        <div>
            <p className='font-extrabold md:text-lg mt-2 col-span-full'>ویژگی‌ها:</p>
        <div className='flex flex-wrap mt-2 gap-3'>
            {
                spec.map(item=>{
                    return(                        
                        <FeatureItem key={item._id || item.id} title={item?.specification_id?.title || ''} value={item.value}/>
                    )
                })
            }
        </div>
        </div>
        ) : null}
        </div>
        <Image src={data?.thumbnail_id?.[0]?.url ? mediaUrl(data?.thumbnail_id?.[0]?.url)  :  '/pg.png'} width={400} height={300} alt={slug} className='w-full md:w-[500px] h-[400px] row-start-1 object-cover rounded-3xl '/>
        </div>
    );
};

export default Info;
