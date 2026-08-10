import Link from 'next/link';
import React from 'react';
import { MdOutlineKeyboardArrowLeft } from 'react-icons/md';

const ShowAllBtn = ({href , text , icon}) => {
    return (
        <Link className='bg-[#308060] text-nowrap text-white items-center rounded-2xl w-fit flex gap-3 md:py-3 py-2 md:px-4 px-3 text-sm md:text-base' href={href} >
            {text ? text : 'مشاهده همه'}
            {icon ? icon : <MdOutlineKeyboardArrowLeft />}
        </Link>
    );
};

export default ShowAllBtn;