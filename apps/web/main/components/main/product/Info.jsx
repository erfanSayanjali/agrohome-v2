import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { FaStar } from 'react-icons/fa';
import { mediaUrl } from '../../../lib/data/stubs';

const FeatureItem = ({title , value}) => {
    return (
        <div className='bg-white p-3 rounded-lg flex flex-col gap-1'>
           <p>{title}</p>
           <p className='text-[#1A1A1A]'>{value}</p>
        </div>
    );
}
const unitRegister = {l:'لیتر',g:'گرم',ml:'میلی بیتر' ,kg:'کیلوگرم'}
const Info = ({slug , data ,specification}) => {
    const spec = specification?.filter(item=>(item?.highlight && item?.specification_id?.position === 'attribute' )) || []
    const package_ids = data?.package_ids || []
    const path_titles=  data.category_id[0].path_titles || []
    const path_slugs=  data.category_id[0].path_slugs || []


    

   
    console.log(path_titles);
    
    
    
    return (
        <div className='bg-[#F0F0F0]  rounded-3xl grid  lg:flex justify-between flex-col lg:flex-row gap-5'>
        <div className='p-5'>
        <div className='text-sm text-gray-600 mb-2'>
            <Link href={'/'} className='cursor-pointer hover:underline'>خانه</Link> / <Link href={'/products'} className='cursor-pointer hover:underline'>کود‌های خانگی</Link> /  

                  {
                    path_titles.map((item,i)=>{
                        return <Link  key={i} className='me-2 cursor-pointer hover:underline' href={`/products/${path_slugs[i]}?sort=newest`}>
                            
                        {item}
                        {path_titles.length === i+1 ? '':<span className='mr-1'>/</span>}
                        </Link>
                    })
                  } /
                  <span className='me-2'>{data.title}</span>
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
        <div>
            <p className='font-extrabold md:text-lg col-span-full'>بسته‌بندی:</p>
        <div className='flex flex-wrap mt-2 gap-3'>
            {
                package_ids.map(item=>{
                    return(                        
                        <div key={item._id} className='bg-white p-3 rounded-lg flex  gap-1'>
                        <p className='text-[#1A1A1A]'>{item.value}</p>
                        
                        <p>{unitRegister[item.unit]}</p>
                     </div>
                    )
                })
            }
        </div>
        </div>
        <div>
            <p className='font-extrabold md:text-lg mt-2 col-span-full'>ویژگی‌ها:</p>
        <div className='flex flex-wrap mt-2 gap-3'>
            {
                spec.map(item=>{
                    
                    
                    return(                        
                        <FeatureItem key={item._id} title={item?.specification_id?.title || ''} value={item.value}/>
                    )
                })
            }
        </div>
        </div>
        </div>
        <Image src={data?.thumbnail_id?.[0].url ? mediaUrl(data?.thumbnail_id?.[0].url)  :  '/pg.png'} width={400} height={300} alt={slug} className='w-full md:w-[500px] h-[400px] row-start-1 object-cover rounded-3xl '/>
        </div>
    );
};

export default Info;