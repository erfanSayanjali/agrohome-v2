import Image from 'next/image';
import Link from 'next/link';
import { GoArrowUpRight } from 'react-icons/go';
import { mediaAlt, mediaUrl } from '../../../lib/data/stubs';

const AboutTrustBanner = ({ cms } = {}) => {
  const image = mediaUrl(cms?.image) || '/abb.png';
  const imageAlt = mediaAlt(cms?.image, 'aboutBanner');
  const title = cms?.title || 'اعتماد شما، انگیزه‌ی ما برای بهتر شدن';
  const accent = cms?.titleAccent || 'انگیزه‌ی ما';
  const accentColor = cms?.accentColor || '#F7DB5E';
  const cta = cms?.cta || { label: 'شروع کنید!', href: '/products' };
  const parts = accent ? title.split(accent) : [title];

  return (
    <div className="relative">
      <Image
        src={image}
        alt={imageAlt}
        width={2000}
        height={500}
        className="-z-50 h-[200px] w-full bg-green-900 object-cover"
      />
      <div className="absolute left-0 top-0 h-[200px] w-full items-center justify-between p-5 text-white md:flex md:px-40">
        <p className="md:text-lg">
          {parts.length > 1 ? (
            <>
              {parts[0]}
              <br />
              <span className="md:text-2xl">
                <span style={{ color: accentColor }}>{accent}</span>
                {parts.slice(1).join(accent)}
              </span>
            </>
          ) : (
            title
          )}
        </p>
        {cta?.label ? (
          <Link
            href={cta.href || '/products'}
            className="mt-6 flex w-fit items-center gap-2 rounded-2xl bg-[#F7DB5E] px-2 py-2 text-black transition-all hover:bg-[#E5C700] md:px-4 md:py-3"
          >
            <GoArrowUpRight fontSize={20} />
            {cta.label}
          </Link>
        ) : null}
      </div>
    </div>
  );
};

export default AboutTrustBanner;
