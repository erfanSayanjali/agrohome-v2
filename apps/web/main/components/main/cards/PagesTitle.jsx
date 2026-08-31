import Image from 'next/image';
import React from 'react';

const PagesTitle = ({ title, alt, image, imagePosition, flushBottom = false }) => {
    return (
        <div
            className={`relative flex w-full min-h-40 items-center justify-start overflow-hidden rounded-none p-4 text-lg font-bold text-white md:min-h-48 md:rounded-3xl md:p-10 md:text-2xl ${flushBottom ? 'mb-0' : 'mb-6 md:mb-10'}`}
        >
            {title}
            <Image alt={alt} src={image ? image : '/pt1.jpg'} width={1000} height={500} className={`${imagePosition} absolute inset-0 -z-50 h-full w-full object-cover`}/>
            <div className='absolute inset-0 -z-50 bg-[#002D1E]/70' />
        </div>
    );
};

export default PagesTitle;
