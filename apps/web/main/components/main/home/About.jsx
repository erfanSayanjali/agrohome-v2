'use client'
import Image from 'next/image';
import React from 'react';
import { motion } from 'framer-motion'
import { mediaUrl } from '../../../lib/data/stubs'

const BenefitItem = ({ title }) => {
  return (
    <div className="flex items-center gap-3 bg-[#F0F0F0] w-full p-2 rounded-xl px-3">
      <svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M9.16667 18.3333C14.2293 18.3333 18.3333 14.2293 18.3333 9.16667C18.3333 4.10406 14.2293 0 9.16667 0C4.10406 0 0 4.10406 0 9.16667C0 14.2293 4.10406 18.3333 9.16667 18.3333Z"
          fill="#308060"
        />
        <path
          d="M7.82586 11.9927C7.64986 11.9927 7.47386 11.9258 7.34003 11.791L5.20144 9.65249C4.93285 9.3839 4.93285 8.94846 5.20144 8.67987C5.47002 8.41129 5.90544 8.41129 6.17403 8.67987L7.82678 10.3326L11.6181 6.54128C11.8867 6.2727 12.3221 6.2727 12.5907 6.54128C12.8593 6.80986 12.8593 7.24531 12.5907 7.5139L8.31262 11.792C8.17787 11.9258 8.00186 11.9927 7.82586 11.9927Z"
          fill="white"
        />
      </svg>
      <p className="text-sm md:text-base">{title}</p>
    </div>
  )
}

function normalizeImages(raw) {
  if (!Array.isArray(raw) || !raw.length) {
    return ['/homeheader.jpg', '/a1.png', '/a2.png']
  }
  return raw
    .map((item) => {
      if (typeof item === 'string') return mediaUrl(item) || item
      if (item && typeof item === 'object') {
        if (item.url) return mediaUrl(item) || item.url
        if (item._value) {
          const v = String(item._value)
          return mediaUrl(v) || v
        }
      }
      return ''
    })
    .filter(Boolean)
}

/** انیمیشن فقط جابه‌جایی — opacity همیشه ۱ تا ناپدید نشود */
function MotionImage({ children, from = 'x', className }) {
  const initial =
    from === 'x' ? { x: 24, opacity: 1 } : from === '-x' ? { x: -24, opacity: 1 } : { y: 24, opacity: 1 }

  return (
    <motion.div
      className={className}
      initial={initial}
      whileInView={{ x: 0, y: 0, opacity: 1 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ type: 'tween', duration: 0.7 }}
    >
      {children}
    </motion.div>
  )
}

const About = ({ cms } = {}) => {
  const title = cms?.title || 'یک انتخاب سبز برای'
  const titleAccent = cms?.titleAccent || 'خونه‌های سبز'
  const text =
    cms?.text ||
    'جایی که کیفیت، دوام و سلامت محیط‌زیست کنار هم جمع می‌شن. ما محصولاتمون رو با مواد کاملاً طبیعی و استانداردهای سخت‌گیرانه تولید می‌کنیم تا هم طول عمر بالایی داشته باشن، هم برای خانواده‌ت امن باشن. ترکیب تجربه‌ی سال‌ها کار تخصصی با فناوری روز، باعث شده بتونیم راهکارهایی ارائه بدیم که هم ظاهر فضای شما رو زیباتر کنه و هم کمترین آسیب رو به طبیعت بزنه.'
  const benefits =
    Array.isArray(cms?.benefits) && cms.benefits.length
      ? cms.benefits.map((b) => (typeof b === 'string' ? b : b?._value || '')).filter(Boolean)
      : [
          'محصولات 100% ارگانیک و طبیعی',
          'بدون بو و مواد شیمیایی مضر',
          'تضمین کیفیت و رضایت مشتری',
        ]
  const images = normalizeImages(cms?.images)
  const years = cms?.years ?? 24
  const yearsLabel = cms?.yearsLabel || 'سال تجربه'

  return (
    <div className="z-50 max-w-7xl mx-3 flex lg:flex-row flex-col-reverse md:gap-20 gap-10 lg:mx-auto my-10 min-w-0">
      <div className="grid grid-cols-[1fr_1fr] grid-rows-[140px_220px] w-full lg:w-[500px] gap-4 items-stretch">
        <MotionImage
          from="x"
          className="w-full h-full rounded-tr-[100px] rounded-3xl overflow-hidden"
        >
          <Image
            src={images[0]}
            width={300}
            height={200}
            alt=""
            unoptimized={String(images[0]).includes('/uploads/')}
            className="object-cover w-full h-full rounded-tr-[100px] rounded-3xl"
          />
        </MotionImage>
        <MotionImage
          from="-x"
          className="w-full h-full row-span-2 rounded-l-[120px] rounded-r-3xl overflow-hidden"
        >
          <Image
            src={images[1] || images[0]}
            width={300}
            height={400}
            alt=""
            unoptimized={String(images[1] || images[0]).includes('/uploads/')}
            className="object-cover w-full h-full rounded-l-[120px] rounded-r-3xl"
          />
        </MotionImage>
        <MotionImage
          from="y"
          className="w-[80%] h-full justify-self-end rounded-b-[80px] rounded-3xl overflow-hidden"
        >
          <Image
            src={images[2] || images[0]}
            width={300}
            height={200}
            alt=""
            unoptimized={String(images[2] || images[0]).includes('/uploads/')}
            className="object-cover w-full h-full rounded-b-[80px] rounded-3xl"
          />
        </MotionImage>
      </div>

      <div className="lg:w-[calc(100%-500px)] w-full flex flex-col justify-start">
        <svg width="39" height="30" viewBox="0 0 39 30" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M37.91 17.68L32.4488 28.5812C32.0875 29.3037 31.3438 29.75 30.5575 29.75H25.0962C24.31 29.75 23.8 28.9212 24.14 28.22L29.75 17H24.4375C22.6737 17 21.25 15.5763 21.25 13.8125V3.1875C21.25 1.42375 22.6737 0 24.4375 0H35.0625C36.8262 0 38.25 1.42375 38.25 3.1875V16.2562C38.25 16.745 38.1437 17.2338 37.91 17.68ZM17 16.2562V3.1875C17 1.42375 15.5763 0 13.8125 0H3.1875C1.42375 0 0 1.42375 0 3.1875V13.8125C0 15.5763 1.42375 17 3.1875 17H8.5L2.89 28.22C2.52875 28.9212 3.05999 29.75 3.84624 29.75H9.30751C10.115 29.75 10.8588 29.3037 11.1988 28.5812L16.66 17.68C16.8725 17.2338 17 16.745 17 16.2562Z"
            fill="#EEEEEE"
          />
        </svg>

        <p className="md:text-3xl text-2xl mt-5 mb-5 font-extrabold">
          {title}
          <br />
          <span className="text-[#155038]">{titleAccent}</span>
        </p>
        <p className="text-justify text-sm md:text-base">{text}</p>
        <div className="flex justify-between gap-5 mt-8">
          <div className="flex flex-col w-max gap-4">
            {benefits.map((b) => (
              <BenefitItem key={b} title={b} />
            ))}
          </div>
          <div className="w-[140px] text-[#0B3D2C] flex h-fit py-10 items-center justify-center flex-col bg-[#F4C111] rounded-b-[100px] border-t-4">
            <p className="text-2xl font-extrabold">{years}+</p>
            <p className="font-extrabold">{yearsLabel}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default About
