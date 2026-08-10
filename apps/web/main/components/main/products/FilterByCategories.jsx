'use client';
import { useState } from 'react';
import { FaCheck } from 'react-icons/fa';
import { MdArrowDropDown } from "react-icons/md";
import { useQueryManager } from '../../../utils/QueryManager';
import FarsiNumber from '../FarsiNumber';
import { useRouter } from 'next/navigation';
const Items = ({ isActive, name, slug ,currentCategory }) => {
    const query = useQueryManager()
    const router = useRouter()
    return (
        <div
            onClick={() => {
                if (slug === 'all') {
                    if(currentCategory?.slug){
                        
                     router.push('/products')
                    }else{
                    query.remove('categories')
                    }
                } else {
                    if(currentCategory?.slug){
                        query.set({ categories: slug+' '+currentCategory?.slug }, { multi: true ,targetUrl:'/products'})
                    }else{
                        query.set({ categories: slug }, { multi: true })

                    }
                }
            }}
            className='flex items-center gap-3 md:gap-4  cursor-pointer '>
            <div className='border border-green-900 h-7  w-7 flex items-center justify-center rounded-md ' >
                {
                    isActive ? <FaCheck className='p-0.5' color='#1A3D39' /> : ''
                }
            </div>
            <p className='text-sm'>
                {name}
            </p>
        </div>
    )
}
const FilterByCategories = ({ product_category, query , currentCategory }) => {
    const [active, setActive] = useState(false)
    const categories = query.get('categories') || currentCategory?.slug || '';
   
    
    return (
        <div>
            <div
                onClick={() => setActive(!active)}
                className={`w-full  h-12 ${active ? 'rounded-t-lg' : 'rounded-lg'}  flex justify-between items-center text-[#353535] md:px-4 px-2 cursor-pointer bg-[#F4F4F4]`}>
                <p className='flex gap-1.5'><span className='hidden md:block'>فیلتر بر اساس</span> دسته‌بندی <span className={`w-[25px] h-[25px] rounded-full flex items-center justify-center text-white bg-green-600 ${!categories ?? categories?.split(' ')?.length ? 'hidden' :""}`}><FarsiNumber>{(categories?.split(' ')?.length)}</FarsiNumber></span></p>
                <MdArrowDropDown fontSize={25} color='#707070' />

            </div>
            <div className={` px-5 flex max-md:max-h-[40%] max-md:h-fit max-md:overflow-auto max-md:fixed max-md:w-full max-md:right-0 z-40 bottom-0 max-md:rounded-2xl rounded-b-none flex-col gap-3 py-3 bg-gray-200 md:rounded-b-2xl max-h-fit transition-all overflow-hidden ${active ? 'h-[1000px]' : 'h-0!  py-0!'}`}>
                <Items currentCategory={currentCategory} slug={'all'} isActive={!categories } name={'همه دسته‌بندی‌ها'} />
                {
                    product_category?.map(category => {


                        return (<Items currentCategory={currentCategory} key={category.slug} slug={category.slug} isActive={categories?.split(' ')?.find(item => item === category.slug)} name={category.title} />)
                    })
                }
            </div>
            {active ? 
            <div 
            onClick={()=>{setActive(false)}}
            className='bg-black/50 fixed md:hidden  top-0 right-0 w-screen h-screen z-30'></div>
            :''}
        </div>
    );
};

export default FilterByCategories;