'use client';

import { useState } from 'react';
import { sanitizeHtml } from '../../../utils/sanitize';

const AccordionItem = ({ title, content }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="rounded-2xl bg-[#F5F5F5] px-5">
      <h3
        onClick={() => setIsOpen(!isOpen)}
        className="flex cursor-pointer items-center justify-between py-4 font-semibold"
      >
        {title}
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            opacity="0.4"
            d="M3.95245 17.1272H27.6671C28.3957 17.1272 28.9846 16.5369 28.9846 15.8097C28.9846 15.0824 28.3957 14.4922 27.6671 14.4922H3.95245C3.22388 14.4922 2.63496 15.0824 2.63496 15.8097C2.63496 16.5369 3.22388 17.1272 3.95245 17.1272Z"
            fill="#454545"
          />
          <path
            d="M13.1748 26.3496C13.5121 26.3496 13.8494 26.2206 14.1063 25.9636C14.6215 25.4485 14.6215 24.6158 14.1063 24.1006L5.81544 15.8098L14.1063 7.51889C14.6215 7.00375 14.6215 6.17102 14.1063 5.65588C13.5912 5.14075 12.7585 5.14075 12.2433 5.65588L3.02094 14.8783C2.5058 15.3934 2.5058 16.2261 3.02094 16.7413L12.2433 25.9636C12.5002 26.2206 12.8375 26.3496 13.1748 26.3496Z"
            fill="#454545"
          />
        </svg>
      </h3>
      <div
        className={`mt-2 max-h-fit overflow-hidden text-gray-600 transition-all ${
          isOpen ? 'h-[1000] pb-5' : 'h-0'
        }`}
      >
        {typeof content === 'string' && content.includes('<') ? (
          <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }} />
        ) : (
          content
        )}
      </div>
    </div>
  );
};

const AboutServices = ({ cms } = {}) => {
  const title = cms?.title || 'خدمات مشتریان';
  const items = Array.isArray(cms?.items) ? cms.items : [];

  return (
    <div className="mx-3 mb-5 flex max-w-7xl flex-col md:my-10 lg:mx-auto">
      <div className="mt-10 flex items-center gap-4">
        <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            opacity="0.4"
            d="M8.77862 28.9176H24.2703C27.3687 28.9176 28.9178 27.3684 28.9178 24.2701V8.77837C28.9178 5.68003 27.3687 4.13086 24.2703 4.13086H8.77862C5.68027 4.13086 4.1311 5.68003 4.1311 8.77837V24.2701C4.1311 27.3684 5.68027 28.9176 8.77862 28.9176Z"
            fill="#25314C"
          />
          <path
            d="M14.9175 20.7702C14.6531 20.7702 14.3887 20.6697 14.1876 20.4672L10.975 17.2547C10.5715 16.8512 10.5715 16.197 10.975 15.7936C11.3784 15.3901 12.0326 15.3901 12.4361 15.7936L14.9188 18.2763L20.6143 12.5809C21.0177 12.1775 21.6719 12.1775 22.0753 12.5809C22.4788 12.9844 22.4788 13.6385 22.0753 14.042L15.6487 20.4687C15.4463 20.6697 15.1819 20.7702 14.9175 20.7702Z"
            fill="#25314C"
          />
        </svg>
        <p className="text-lg font-extrabold">{title}</p>
      </div>
      <div className="mt-6 grid items-start gap-10 border-t border-gray-300 pt-6 md:grid-cols-2">
        {items.map((item, i) => (
          <AccordionItem key={i} title={item.title} content={item.content} />
        ))}
      </div>
    </div>
  );
};

export default AboutServices;
