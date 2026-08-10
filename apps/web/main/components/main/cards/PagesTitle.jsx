import Image from 'next/image';
import React from 'react';

const PagesTitle = ({title ,alt , image , imagePosition}) => {
    return (
        <div className='relative p-10 md:rounded-3xl overflow-hidden text-white text-lg md:text-2xl font-bold flex justify-start items-center md:h-48 h-32 mb-10'>
            {title}
            <Image alt={alt} src={image ? image : '/pt1.jpg'} width={1000} height={500} className={` ${imagePosition} w-full object-cover -z-50 h-full absolute top-0 left-0 `}/>
            <div className='bg-[#002D1E]/70 w-full h-full absolute -z-50 top-0 left-0' />
        </div>
    );
};

export default PagesTitle;