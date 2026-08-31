'use client';

import { useState } from 'react';
import Image from 'next/image';
import Form from '../product/Form';
import { mediaAlt, mediaUrl, submitContact } from '../../../lib/data/stubs';
import { UseSwal } from '../../../utils/helper.js';

const inputs = [
  { value: '', id: 'fullName', placeholder: 'نام و نام خانوادگی', colspan: 1 },
  { value: '', id: 'subject', placeholder: 'موضوع', colspan: 1 },
  { value: '', id: 'email', placeholder: 'ایمیل', colspan: 1 },
  { value: '', id: 'phone', placeholder: 'شماره تماس', colspan: 1 },
  { value: '', id: 'message', placeholder: 'پیام شما', colspan: 2 },
];

const DEFAULT_MAP =
  'https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d3239.668737981355!2d51.38996823122519!3d35.709768587810444!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sfa!2suk!4v1763887018510!5m2!1sfa!2suk';

const ContactFormSection = ({ cms } = {}) => {
  const [status, setStatus] = useState('idle');
  const sidebarEyebrow = cms?.sidebarEyebrow || '7 روز هفتــه';
  const sidebarTitle = cms?.sidebarTitle || 'پاسخگـوی شمــا هستیـــم…';
  const sidebarImage = mediaUrl(cms?.sidebarImage) || '/ccc.png';
  const sidebarImageAlt = mediaAlt(cms?.sidebarImage, 'contact');
  const formTitle = cms?.formTitle || 'سوال، درخواست یا پیشنهادی دارید؟ بنویسید..';
  const submitLabel = cms?.submitLabel || 'ارسال پیام';
  const mapEmbedUrl = cms?.mapEmbedUrl || DEFAULT_MAP;

  async function handleSubmit(fields) {
    const payload = Object.fromEntries(
      (Array.isArray(fields) ? fields : []).map((f) => [f.id?.trim(), f.value])
    );
    if (!String(payload.message || '').trim()) {
      UseSwal('error', 'متن پیام الزامی است.');
      return;
    }
    setStatus('loading');
    try {
      const res = await submitContact(payload);
      if (res?.ok) {
        UseSwal('success', 'پیام شما با موفقیت ارسال شد.');
      } else {
        UseSwal('error', res?.message || 'ارسال پیام ناموفق بود. دوباره تلاش کنید.');
      }
    } catch {
      UseSwal('error', 'ارسال پیام ناموفق بود. دوباره تلاش کنید.');
    } finally {
      setStatus('idle');
    }
  }

  return (
    <div className="mt-20 grid items-start gap-10 px-3 md:flex md:h-[420px] md:px-0">
      <div className="relative h-full w-full overflow-hidden rounded-xl bg-[#105238] p-7 md:w-[230px]">
        <p className="mb-2 text-center text-lg text-[#F4C111]">{sidebarEyebrow}</p>
        <p className="text-center font-extrabold text-white whitespace-pre-line">{sidebarTitle}</p>
        <Image
          src={sidebarImage}
          className="mx-auto max-md:w-[200px]"
          alt={sidebarImageAlt}
          width={500}
          height={300}
        />
        <Image
          className="absolute bottom-0"
          alt="shape-1"
          src="/ccs.png"
          width={500}
          height={300}
        />
        <Image
          alt="shape-2"
          className="absolute top-0 right-0 rotate-180"
          src="/ccs.png"
          width={150}
          height={300}
        />
      </div>
      <div className="row-start-1 h-full rounded-2xl bg-[#F3F3F3] p-3 md:w-[calc(100%-450px)] md:p-10">
        <p className="font-extrabold md:text-lg">{formTitle}</p>
        <Form
          className="mt-4 w-full [&>input]:bg-white [&>textarea]:bg-white"
          onClick={handleSubmit}
          submitBtn={
            <button
              type="button"
              disabled={status === 'loading'}
              className="col-span-2 mt-2 flex w-fit cursor-pointer items-center gap-2 self-end rounded-2xl bg-green-800 p-3 text-white transition-colors hover:bg-green-900 disabled:opacity-60 !justify-self-end"
            >
              {status === 'loading' ? 'در حال ارسال…' : submitLabel}
            </button>
          }
          data={inputs}
        />
      </div>
      <iframe
        className="h-full w-full md:w-[230px]"
        src={mapEmbedUrl}
        width="600"
        height="450"
        allowFullScreen=""
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="نقشه"
      />
    </div>
  );
};

export default ContactFormSection;
