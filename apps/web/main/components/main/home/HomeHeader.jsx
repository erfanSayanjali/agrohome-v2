import Image from 'next/image'
import Link from 'next/link';
import { GoArrowUpRight } from "react-icons/go";
import { mediaUrl, mediaAlt } from '../../../lib/data/stubs';

const HomeHeader = ({ cms } = {}) => {
  const title = cms?.title || 'از دل طبیعت، مستقیم برای گلدون تو';
  const accent = cms?.titleAccent || 'طبیعت';
  const subtitle =
    cms?.subtitle ||
    'با کودهای ارگانیک ما، بدون بوی بد و مواد شیمیایی، گیاهات رو زنده کن.';
  const image = mediaUrl(cms?.image) || '/homeheader.jpg';
  const imageAlt = mediaAlt(cms?.image, 'header');
  const accentColor = cms?.accentColor || '#B1D082';
  const buttonColor = cms?.buttonColor || '#308060';
  const primary = cms?.primaryCta || { label: 'درباره‌ ما', href: '/products' };
  const secondary = cms?.secondaryCta || {
    label: 'خرید کودهای خانگی',
    href: '/products',
  };
  const titleParts = title.split(accent);

  return (
    <div className='md:h-[600px] h-[400px] flex items-start justify-center '>
      <div className='absolute top-0 left-0 w-full -z-10 '>

        <div className="relative w-full  flex items-center justify-center md:h-[600px] h-[400px]">

          <Image
            src={image}
            alt={imageAlt}
            width={1000}
            height={600}
            priority
            loading='eager'
            unoptimized={image.includes('/uploads/')}
            className="
            object-cover w-full h-full absolute -z-10
            "
          />

          <div className="absolute inset-0 bg-linear-to-t from-[#00160E] -z-10 to-transparent"></div>

        </div>
        <Image src={'/g1.png'} priority
          loading='eager' width={200} height={100} alt='g1' className='md:w-[200px] w-[150px] object-contain absolute -bottom-40 left-0' />
        <Image src={'/g2.png'} priority
          loading='eager' width={200} height={100} alt='g2' className='md:w-[200px] w-[150px] object-contain absolute right-0  -bottom-[100px]' />

      </div>
      <div className='max-w-2xl flex flex-col z-20 justify-center mt-12 items-center absolute mx-auto px-5 md:py-20 text-white'>

        <h1 className='font-extrabold text-2xl text-center md:text-3xl'>
          {titleParts.length > 1 ? (
            <>
              {titleParts[0]}
              <span style={{ color: accentColor }}>{accent}</span>
              {titleParts.slice(1).join(accent)} 🍃
            </>
          ) : (
            <>{title} 🍃</>
          )}
        </h1>

        <h2 className='my-2 text-center'>
          {subtitle}
        </h2>

        <div className='flex items-center gap-3'>
          <Link
            href={primary.href || '/products'}
            className='relative flex items-center mt-5 w-fit text-nowrap md:w-auto h-full px-4 py-2 text-sm rounded-3xl font-bold'
            style={{ background: buttonColor }}
          >
            {primary.label || 'درباره‌ ما'}
          </Link>
          <Link
            href={secondary.href || '/products'}
            className='bg-transparent relative flex items-center mt-5 w-full md:w-auto h-full px-4 py-2 text-sm rounded-3xl border border-white font-bold'
          >
            <GoArrowUpRight
              className='bg-white absolute box-content p-3 rounded-full right-0'
              color='#000'
            />
            <span className='mr-8'>{secondary.label || 'خرید کودهای خانگی'}</span>
          </Link>

        </div>

      </div>
    </div>
  );
};

export default HomeHeader;
