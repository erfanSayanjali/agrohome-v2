'use client'
import Image from 'next/image';
import { useState } from 'react';
import { IoIosArrowDown } from "react-icons/io";
import { mediaUrl } from '../../../lib/data/stubs';

const FaqItem = ({q , a , _id})=>{
    const [active , setActive] = useState('')

    return(
        <div className='select-none' key={_id}>
            <p
            onClick={()=>setActive(_id === active ? '' : _id)}
            className={`${active === _id ? 'bg-[#F3CC30]':'bg-[#0B2C28] text-white'} cursor-pointer transition-colors text-sm flex items-center px-3 justify-between p-3 md:rounded-4xl rounded-lg `}>
                {q}

                <IoIosArrowDown className={`${active === _id ? 'rotate-180':''} transition-all`} fontSize={20} />
            </p>
            <div dangerouslySetInnerHTML={{__html:a}} className={` ${active === _id ?'opacity-100 h-[1000px] p-3' :'opacity-0 h-0 invisible '} max-h-fit  text-justify transition-all ext-sm text-white`}>
                
            </div>
        </div>
    )

}
const Faq = ({faq, cms} = {}) => {
    const items = faq?.content?.items || cms?.items || [];
    const eyebrow = cms?.eyebrow || 'سوالات متداول مشتریان';
    const title = cms?.title || 'بیشترین سوالاتی که تا الان از ما پرسیده شده ..';
    const images = (Array.isArray(cms?.images) && cms.images.length ? cms.images : ['/faq1.png', '/faq2.png'])
      .map((img) => mediaUrl(typeof img === 'string' ? img : img?._value) || img)
      .filter(Boolean);

    return (
        <div className='w-full bg-[#123833] bg-[url("/faqh.png")] '>
            <div className='max-w-7xl flex lg:flex-row flex-col lg:mx-auto mx-3 lg:p-20 p-10 px-0'>
                <div className='text-center mb-2 lg:hidden'>
                <p className='text-[#F3CC30]'>
                {eyebrow}
                </p>
                <p className='text-xl font-extrabold text-white mt-2'>{title}</p>
                </div>
                  <div className='lg:w-[520px] w-[320px] flex overflow-hidden items-center justify-center w-full h-[300px] relative'>
                    <Image className='rounded-2xl lg:w-[300px]  h-[300px] object-cover' src={images[0]} alt='faq1' width={500} height={200} unoptimized={String(images[0]).includes('/uploads/')}/>
                    <Image className='lg:translate-x-21 translate-x-16 rounded-2xl lg:w-[250px] h-[250px] object-cover' src={images[1] || images[0]} alt='faq2' width={400} height={200} unoptimized={String(images[1] || images[0]).includes('/uploads/')}/>
                  </div>
                <div className='lg:w-[calc(100%-520px)] w-full my'>
                <p className='text-[#F3CC30] hidden lg:block'>
                {eyebrow}
                </p>
                <p className='text-xl font-extrabold text-white mt-2  hidden lg:block'>{title}</p>
                <div className='flex mt-5 flex-col gap-5'>
                    {
                        items?.length ?
                        items.map((item,i)=>
                            <FaqItem  key={item._id || item.id || i}  _id={item._id || item.id || String(i)} a={item.content} q={item.title}/>

                        )
                        :''
                    }
               
                </div>
                </div>
            </div>
            
        </div>
    );
};

export default Faq;