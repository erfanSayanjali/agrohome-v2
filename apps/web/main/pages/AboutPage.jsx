'use client';
import React, { useState } from 'react';
import PagesTitle from '../components/main/cards/PagesTitle';
import { GoArrowUpRight } from "react-icons/go";
import Image from 'next/image';
import Link from 'next/link';

const Title = () => {
    return (
        <PagesTitle
            imagePosition={'object-[0px_90%] '}
            image={'/ai1.jpg'}
            alt={'aboutUs'} 
            title={
                <div>
                    <p>
                    درباره <span className='text-[#F4C111]'>آگروهوم</span>
                </p>
                <div className='text-xs mt-1'>
                    <Link href={'/'}>
                    صفحه اصلی
                    </Link>
                    /
                    درباره ما
                </div>
                </div>
            }
        />
    )
}

const ImagesGrid = () => {
    return (
        <div className='grid grid-cols-2 gap-4 row-span-2 md:w-[450px] '>
            <img src='/ab1.png' alt='about1' className='w-full h-[140px] object-cover rounded-2xl row-span-1' />
            <img src='/ab2.png' alt='about2' className='w-full md:h-[250px] h-[190px] object-cover rounded-2xl row-span-2' />
            <img src='/ab3.png' alt='about3' className='w-full md:h-[250px] h-[190px] object-cover rounded-2xl row-span-2' />
            <img src='/ab4.png' alt='about3' className='w-full h-[140px] object-cover rounded-2xl row-span-1' />
        </div>
    )
}
const AccordionItem = ({ title, content }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className='  bg-[#F5F5F5] px-5 rounded-2xl'>
            <h3
            onClick={() => setIsOpen(!isOpen)}
            className={`font-semibold py-4 cursor-pointer flex items-center justify-between `}>{title}
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
<path opacity="0.4" d="M3.95245 17.1272H27.6671C28.3957 17.1272 28.9846 16.5369 28.9846 15.8097C28.9846 15.0824 28.3957 14.4922 27.6671 14.4922H3.95245C3.22388 14.4922 2.63496 15.0824 2.63496 15.8097C2.63496 16.5369 3.22388 17.1272 3.95245 17.1272Z" fill="#454545"/>
<path d="M13.1748 26.3496C13.5121 26.3496 13.8494 26.2206 14.1063 25.9636C14.6215 25.4485 14.6215 24.6158 14.1063 24.1006L5.81544 15.8098L14.1063 7.51889C14.6215 7.00375 14.6215 6.17102 14.1063 5.65588C13.5912 5.14075 12.7585 5.14075 12.2433 5.65588L3.02094 14.8783C2.5058 15.3934 2.5058 16.2261 3.02094 16.7413L12.2433 25.9636C12.5002 26.2206 12.8375 26.3496 13.1748 26.3496Z" fill="#454545"/>
</svg>

            </h3>
            <div className={`mt-2 text-gray-600 max-h-fit overflow-hidden transition-all  ${isOpen ? 'h-[1000] pb-5 ' : 'h-0'}`}>
                {content}
            </div>
        </div>
    );
    
}
const AboutPage = ({kadamat}) => {
    return (
        <div className='min-h-screen'>
            <div className='max-w-7xl md:mx-3 lg:mx-auto md:my-10'>
                <Title />
                <div className='md:my-20 flex md:flex-row px-3 md:px-0 flex-col gap-10'>
                    <ImagesGrid  />
                    <div className='md:w-[calc(100%-450px)] flex flex-col py-5'>
                        <p>
                            درباره ما
                        </p>
                        <h1 className='text-xl font-extrabold my-4'>
                            با <span className='text-[#105238]'>آگروهوم</span> هوشمند خرید کن!
                        </h1>
                        <p className='leading-relaxed text-justify text-gray-600'>
                            آگروهوم یک فروشگاه آنلاین است که به صورت تخصصی در زمینه فروش کودهای خانگی فعالیت می‌کند. هدف ما ارائه محصولات با کیفیت و سازگار با محیط زیست است تا به شما در بهبود رشد گیاهان خانگی‌تان کمک کنیم. علاوه بر فروش محصولات، ما یک بخش وبلاگی داریم که اطلاعات مفیدی درباره نگهداری گیاهان و استفاده بهینه از کودها ارائه می‌دهد. همچنین، نمایشگاهی از محصولات متنوع برای آشنایی بیشتر شما با گزینه‌های موجود فراهم کرده‌ایم.
                        </p>
                        <button className='bg-[#308060] flex items-center gap-2 hover:bg-[#105238] transition-all text-white rounded-2xl px-4 py-3 w-fit  mt-6'>
                            <GoArrowUpRight fontSize={20} />

                            تماس با ما
                        </button>
                    </div>
                </div>
            </div>

            <div className='relative '>
                <Image
                    src={'/abb.png'}
                    alt='aboutBanner'
                    width={2000}
                    height={500}
                    className='w-full -z-50 object-cover h-[200px] bg-green-900 '

                />
                <div className='absolute   top-0 left-0 w-full h-[200px] md:px-40 p-5  justify-between md:flex items-center   text-white'>
                    <p className='md:text-lg  '>
                        اعتماد شما،
                        <br />
                        <span className='md:text-2xl'>
                            <span className='text-[#F7DB5E]'>انگیزه‌ی ما</span> برای بهتر شدن
                        </span>
                    </p>
                    {/* <p className=' line-clamp-3 w-[60%] text-justify leading-relaxed'>
                        در لورم ایپسوم، سال‌ها تلاش ما فقط یک هدف داشته: جلب اعتماد و رضایت شما..  امروز، همراهی هزاران کاربر راضی، بزرگ‌ترین افتخار ماست و انـــگیزه‌ای برای ادامه‌ی راهی که با تعهد، صداقت و کیفیت ساختیم.
                </p> */}
                    <button className='bg-[#F7DB5E] flex items-center gap-2 hover:bg-[#E5C700] transition-all text-black rounded-2xl md:px-4 px-2 md:py-3 py-2 w-fit  mt-6'>
                    
<GoArrowUpRight fontSize={20} />
                        
                شروع کنید!
                        </button>
                    </div>
            </div>
                <div className='max-w-7xl mx-3 lg:mx-auto md:my-10 mb-5 flex flex-col'>
                    <div className='flex items-center gap-4 mt-10'>
                        <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path opacity="0.4" d="M8.77862 28.9176H24.2703C27.3687 28.9176 28.9178 27.3684 28.9178 24.2701V8.77837C28.9178 5.68003 27.3687 4.13086 24.2703 4.13086H8.77862C5.68027 4.13086 4.1311 5.68003 4.1311 8.77837V24.2701C4.1311 27.3684 5.68027 28.9176 8.77862 28.9176Z" fill="#25314C" />
                            <path d="M14.9175 20.7702C14.6531 20.7702 14.3887 20.6697 14.1876 20.4672L10.975 17.2547C10.5715 16.8512 10.5715 16.197 10.975 15.7936C11.3784 15.3901 12.0326 15.3901 12.4361 15.7936L14.9188 18.2763L20.6143 12.5809C21.0177 12.1775 21.6719 12.1775 22.0753 12.5809C22.4788 12.9844 22.4788 13.6385 22.0753 14.042L15.6487 20.4687C15.4463 20.6697 15.1819 20.7702 14.9175 20.7702Z" fill="#25314C" />
                        </svg>
                        <p className='text-lg font-extrabold'> {kadamat?.title || 'خدمات مشتریان' }</p>
                    </div>
                    <div className='mt-6 grid md:grid-cols-2 items-start gap-10 border-t border-gray-300 pt-6'>
                        {
                            kadamat?.content?.items?.length ? 
                            kadamat?.content?.items.map((item,i)=>{
                                return  <AccordionItem key={i} title={item.title} content={item.content}/>

                            })
                            :''
                        }
                    </div>
                </div>
       
 </div>
    );
};

export default AboutPage;