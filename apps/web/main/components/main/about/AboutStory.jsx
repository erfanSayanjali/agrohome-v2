import Link from 'next/link';
import { GoArrowUpRight } from 'react-icons/go';
import { mediaUrl } from '../../../lib/data/stubs';

function normalizeImages(images) {
  if (!Array.isArray(images) || !images.length) {
    return ['/ab1.png', '/ab2.png', '/ab3.png', '/ab4.png'];
  }
  return images
    .map((img) => mediaUrl(typeof img === 'string' ? img : img?._value || img?.url))
    .filter(Boolean);
}

const AboutStory = ({ cms } = {}) => {
  const eyebrow = cms?.eyebrow || 'درباره ما';
  const title = cms?.title || 'با آگروهوم هوشمند خرید کن!';
  const accent = cms?.titleAccent || 'آگروهوم';
  const accentColor = cms?.accentColor || '#105238';
  const text =
    cms?.text ||
    'آگروهوم یک فروشگاه آنلاین است که به صورت تخصصی در زمینه فروش کودهای خانگی فعالیت می‌کند. هدف ما ارائه محصولات با کیفیت و سازگار با محیط زیست است تا به شما در بهبود رشد گیاهان خانگی‌تان کمک کنیم. علاوه بر فروش محصولات، ما یک بخش وبلاگی داریم که اطلاعات مفیدی درباره نگهداری گیاهان و استفاده بهینه از کودها ارائه می‌دهد. همچنین، نمایشگاهی از محصولات متنوع برای آشنایی بیشتر شما با گزینه‌های موجود فراهم کرده‌ایم.';
  const images = normalizeImages(cms?.images);
  const cta = cms?.cta || { label: 'تماس با ما', href: '/contact' };
  const parts = accent ? title.split(accent) : [title];

  const [a, b, c, d] = [
    images[0] || '/ab1.png',
    images[1] || '/ab2.png',
    images[2] || '/ab3.png',
    images[3] || '/ab4.png',
  ];

  return (
    <div className="mx-3 flex max-w-7xl flex-col gap-10 px-3 md:mx-3 md:my-20 md:flex-row md:px-0 lg:mx-auto">
      <div className="row-span-2 grid grid-cols-2 gap-4 md:w-[450px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={a} alt="about1" className="row-span-1 h-[140px] w-full rounded-2xl object-cover" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={b}
          alt="about2"
          className="row-span-2 h-[190px] w-full rounded-2xl object-cover md:h-[250px]"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={c}
          alt="about3"
          className="row-span-2 h-[190px] w-full rounded-2xl object-cover md:h-[250px]"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={d} alt="about4" className="row-span-1 h-[140px] w-full rounded-2xl object-cover" />
      </div>
      <div className="flex flex-col py-5 md:w-[calc(100%-450px)]">
        <p>{eyebrow}</p>
        <h1 className="my-4 text-xl font-extrabold">
          {parts.length > 1 ? (
            <>
              {parts[0]}
              <span style={{ color: accentColor }}>{accent}</span>
              {parts.slice(1).join(accent)}
            </>
          ) : (
            title
          )}
        </h1>
        <p className="text-justify leading-relaxed text-gray-600">{text}</p>
        {cta?.label ? (
          <Link
            href={cta.href || '/contact'}
            className="mt-6 flex w-fit items-center gap-2 rounded-2xl bg-[#308060] px-4 py-3 text-white transition-all hover:bg-[#105238]"
          >
            <GoArrowUpRight fontSize={20} />
            {cta.label}
          </Link>
        ) : null}
      </div>
    </div>
  );
};

export default AboutStory;
