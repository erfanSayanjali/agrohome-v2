import React from 'react';

const Title = ({label}) => {
    return (
        <div className="flex items-center gap-2 text-lg font-bold border-b w-full mb-2 border-gray-200 pb-3">
        <div className='bg-[#EAC52E] w-[13px] h-[9px] rounded-3xl' />
        {
            label
        }
    </div>
    );
};

export default Title;