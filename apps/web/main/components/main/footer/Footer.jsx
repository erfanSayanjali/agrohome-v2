import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { FaInstagram } from 'react-icons/fa';
import { PiTelegramLogoLight } from 'react-icons/pi';
import { mediaUrl } from '../../../lib/data/stubs';

const svg = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M7.00033 0.729492C3.54233 0.729492 0.729492 3.54291 0.729492 7.00033C0.729492 10.4577 3.54233 13.2712 7.00033 13.2712C10.4583 13.2712 13.2712 10.4577 13.2712 7.00033C13.2712 3.54291 10.4583 0.729492 7.00033 0.729492ZM7.00033 12.3962C4.02474 12.3962 1.60449 9.97591 1.60449 7.00033C1.60449 4.02474 4.02474 1.60449 7.00033 1.60449C9.97591 1.60449 12.3962 4.02474 12.3962 7.00033C12.3962 9.97591 9.97591 12.3962 7.00033 12.3962ZM9.35116 5.32965C9.52208 5.50057 9.52208 5.77767 9.35116 5.94859L6.62875 8.671C6.54358 8.75617 6.43158 8.79932 6.31958 8.79932C6.20758 8.79932 6.09558 8.75675 6.01041 8.671L4.64949 7.31008C4.47858 7.13916 4.47858 6.86206 4.64949 6.69114C4.82041 6.52023 5.0975 6.52023 5.26841 6.69114L6.32017 7.74292L8.73283 5.33026C8.90374 5.15934 9.18024 5.15932 9.35116 5.32965Z"
      fill="white"
    />
  </svg>
);

const LiItem = ({ href, title }) => {
  return (
    <li>
      <Link
        className="text-sm flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
        href={href || '#'}
      >
        {svg}
        {title}
      </Link>
    </li>
  );
};

function SocialIcon({ label }) {
  const key = String(label || '').toLowerCase();
  if (key.includes('instagram') || key.includes('اینستا')) {
    return <FaInstagram className="box-content p-2 border border-white rounded-full" />;
  }
  if (key.includes('telegram') || key.includes('تلگرام')) {
    return <PiTelegramLogoLight className="box-content p-2 border border-white rounded-full" />;
  }
  return (
    <span className="box-content px-3 py-2 border border-white rounded-full text-sm">
      {label}
    </span>
  );
}

const Footer = ({ data }) => {
  const logoUrl = mediaUrl(data?.logoUrl) || '/logo.png';
  const text = data?.footerText || '';
  const socialLinks = Array.isArray(data?.socialLinks) ? data.socialLinks : [];
  const lists = Array.isArray(data?.footerLinkGroups) ? data.footerLinkGroups : [];

  return (
    <div className="w-full bg-[#103631f6] relative overflow-hidden ">
      <Image
        src={'/footers.png'}
        width={1000}
        height={500}
        className="absolute object-cover -z-50 bottom-0 w-full h-[900px]"
        alt="footer-shape"
      />
      <div className="max-w-7xl flex flex-col lg:flex-row justify-between lg:mx-auto mx-3 py-20">
        <div className="flex md:w-[400px] flex-col gap-2">
          <Image
            className="w-[140px] "
            src={logoUrl}
            width={150}
            height={100}
            alt="logo-footer"
            unoptimized={String(logoUrl).includes('/uploads/')}
          />
          {text ? (
            <p className="text-sm text-gray-300 max-w-md mt-y text-justify">{text}</p>
          ) : null}
          {socialLinks.length ? (
            <>
              <p className="text-[#F7DB5E]">شبکه‌های اجتماعی</p>
              <div className="flex mt-1 items-center gap-3 text-white text-2xl">
                {socialLinks.map((item, i) => (
                  <Link
                    key={`${item.href}-${i}`}
                    href={item.href || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={item.label || 'social'}
                  >
                    <SocialIcon label={item.label} />
                  </Link>
                ))}
              </div>
            </>
          ) : null}
        </div>
        <div className="flex gap-20 mt-5 md:mt-0">
          {lists.length ? (
            lists.map((item, i) => {
              const items = item?.links || [];
              return (
                <div key={`${item.title}-${i}`}>
                  <p className="text-[#F7DB5E] mb-5 font-extrabold">{item.title}</p>
                  <ul className="flex flex-col gap-2">
                    {items.map((link, j) => (
                      <LiItem key={`${link.href}-${j}`} href={link.href} title={link.title} />
                    ))}
                  </ul>
                </div>
              );
            })
          ) : (
            <div>
              <p className="text-[#F7DB5E] mb-5 font-extrabold">دسترسی سریع</p>
              <ul className="flex flex-col gap-2">
                <LiItem href="/" title="صفحه اصلی" />
                <LiItem href="/products" title="محصولات" />
                <LiItem href="/about" title="درباره ما" />
                <LiItem href="/contact" title="تماس با ما" />
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Footer;
