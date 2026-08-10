'use client'

import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { Pagination } from 'swiper/modules';

import 'swiper/css/pagination';
import { useState } from 'react';



const Slider = ({ slides, pagination = false, sliderClass='slider-default' , className, gap, width }) => {
    const [init, setInit] = useState(false)
    const paginationDefault = {
        clickable: true,
        renderBullet: (index, className) => `<span class="${className} default-bullet"></span>`,
    };

    return (
        <>
            <div
                style={{gap}}
                className={` ${sliderClass} ${className} flex max-w-7xl  z-10 overflow-hidden ${!init ? '' : 'hidden!'}`}
            >
                {slides.map((slide, index) => (
                        
                      <div style={{width}} key={index}>
                        {slide}  
                      </div>
                   
                ))}
            </div>
            <Swiper
                spaceBetween={gap}
                className={`  ${sliderClass} ${className} ${init ? '' : 'hidden!'}`}
                slidesPerView={'auto'}
                modules={[Pagination]}
                pagination={pagination || paginationDefault}
                onInit={(swiper) => { 
                    setTimeout(() => {
                        setInit(!init)
                    }, 500);
                 }}

            >
                {slides.map((slide, index) => (
                    <SwiperSlide style={{ width }} key={index}>
                        {slide}
                    </SwiperSlide>
                ))}
            </Swiper>

        </>
    );
}

export default Slider