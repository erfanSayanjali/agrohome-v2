'use client';

import { useEffect, useState } from "react";

const AvailableProducts = ({query}) => {
    const [active , setActive] = useState(!!query.get('available'));
    useEffect(()=>{
        setActive(query.get('available'))
    },[query.get('available')])
    return (
        <div 
        onClick={()=> {
            if(active){
                  query.remove('available')
            }else{
                query.set({available:1})
            }
        }}
        className=' justify-between hidden md:flex rounded-lg py-4 text-[#353535] items-center px-4 cursor-pointer bg-[#F4F4F4]'>
            محصولات موجود

            <div className={`w-10 flex bg-[#FFFFFF]  rounded-xl transition-all px-[3px] ${active ? 'justify-end bg-green-600' : 'justify-start'} items-center h-6`}>
                <div className='rounded-full bg-[#C7CBCE] w-4 h-4'/>
            </div>
        </div>
    );
};

export default AvailableProducts;