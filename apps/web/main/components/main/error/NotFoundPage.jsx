'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { MdOutlineKeyboardArrowLeft } from 'react-icons/md';
import { IoHomeOutline, IoLeafOutline } from 'react-icons/io5';
import { HiOutlineShoppingBag } from 'react-icons/hi2';
import { TbPlant2 } from 'react-icons/tb';

const LostPlantArt = () => (
  <svg
    viewBox="0 0 320 240"
    className="h-[200px] w-full max-w-[320px] md:h-[240px]"
    aria-hidden
  >
    <defs>
      <linearGradient id="nf-sky" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#E8F1EA" />
        <stop offset="100%" stopColor="#F7FAF6" />
      </linearGradient>
    </defs>

    <rect x="0" y="0" width="320" height="240" rx="24" fill="url(#nf-sky)" />

    <ellipse cx="160" cy="210" rx="90" ry="12" fill="#D7E4D8" opacity="0.7" />

    <motion.g
      initial={{ rotate: -4 }}
      animate={{ rotate: [ -4, 4, -4 ] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      style={{ transformOrigin: '160px 130px' }}
    >
      <path
        d="M118 168c0-6 6-10 14-10h56c8 0 14 4 14 10v18c0 14-14 24-42 24s-42-10-42-24v-18z"
        fill="#C9784A"
      />
      <path
        d="M122 168c0-4 4-7 10-7h56c6 0 10 3 10 7H122z"
        fill="#A85F38"
      />
      <ellipse cx="160" cy="164" rx="28" ry="8" fill="#6B4A32" />
      <path
        d="M160 162V88"
        stroke="#2F6B4F"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M161 98c-18-3-30-18-26-34 18 3 30 18 26 34z"
        fill="#3E8A62"
      />
      <path
        d="M161 92c18-2 32-16 30-32-18 2-32 16-30 32z"
        fill="#4FA276"
      />
      <circle cx="161" cy="78" r="5" fill="#F4C111" />
    </motion.g>

    <motion.g
      animate={{ y: [0, -6, 0], opacity: [0.6, 1, 0.6] }}
      transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
    >
      <path
        d="M52 72c8-14 22-20 34-14-6 12-20 18-34 14z"
        fill="#4FA276"
        opacity="0.55"
      />
      <path
        d="M268 96c10-12 26-16 38-8-8 10-24 14-38 8z"
        fill="#3E8A62"
        opacity="0.45"
      />
    </motion.g>

    <g fill="#105238" opacity="0.12">
      <circle cx="48" cy="48" r="3" />
      <circle cx="72" cy="36" r="2" />
      <circle cx="252" cy="52" r="2.5" />
      <circle cx="278" cy="38" r="2" />
    </g>

    <text
      x="160"
      y="58"
      textAnchor="middle"
      fill="#105238"
      fontSize="44"
      fontWeight="900"
      fontFamily="inherit"
      opacity="0.18"
    >
      404
    </text>

    <motion.g
      animate={{ x: [0, 4, 0], y: [0, -3, 0] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <circle cx="228" cy="72" r="22" fill="none" stroke="#105238" strokeWidth="4" />
      <path
        d="M244 88l14 14"
        stroke="#105238"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <text
        x="228"
        y="79"
        textAnchor="middle"
        fill="#105238"
        fontSize="13"
        fontWeight="800"
        fontFamily="inherit"
      >
        ?
      </text>
    </motion.g>
  </svg>
);

const quickLinks = [
  { href: '/', label: 'صفحه اصلی', icon: IoHomeOutline },
  { href: '/products', label: 'محصولات', icon: HiOutlineShoppingBag },
  { href: '/blogs', label: 'وبلاگ', icon: IoLeafOutline },
  { href: '/contact', label: 'تماس با ما', icon: TbPlant2 },
];

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: 'easeOut' },
  }),
};

const NotFoundPage = () => {
  return (
    <main className="relative overflow-hidden px-3 py-12 md:py-20">
      <div className="pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full bg-[#F4C111]/12 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-[#308060]/10 blur-3xl" />

      <div className="relative mx-auto max-w-3xl">
        <motion.section
          initial="hidden"
          animate="visible"
          className="overflow-hidden rounded-3xl border border-[#D5DDD5]/80 bg-linear-to-b from-[#F8FAF7] to-[#EEF3EE] px-5 py-10 text-center shadow-[0_24px_60px_-32px_rgba(16,82,56,0.22)] md:px-12 md:py-14"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-linear-to-r from-transparent via-[#F4C111] to-transparent opacity-70" />

          <motion.div variants={fadeUp} custom={0} className="empty-float mx-auto w-fit">
            <LostPlantArt />
          </motion.div>

          <motion.p
            variants={fadeUp}
            custom={1}
            className="mt-4 flex items-center justify-center gap-2 text-[13px] text-[#308060]"
          >
            <span className="inline-block h-[7px] w-[12px] rounded-full bg-[#EAC52E]" />
            آگروهوم
          </motion.p>

          <motion.h1
            variants={fadeUp}
            custom={2}
            className="mt-2 text-3xl font-black tracking-tight text-[#105238] md:text-5xl"
          >
            <span className="fanum">۴۰۴</span>
            <span className="mx-2 text-[#C9784A]">·</span>
            صفحه پیدا نشد
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={3}
            className="mx-auto mt-4 max-w-lg text-sm leading-8 text-[#5F6B64] md:text-[15px]"
          >
            انگار این مسیر به باغچه‌ای ختم شده که هنوز کاشته نشده! آدرس را بررسی کنید
            یا از لینک‌های زیر به مسیر درست برگردید.
          </motion.p>

          <motion.div
            variants={fadeUp}
            custom={4}
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link
              href="/"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#308060] px-5 py-3.5 text-sm font-medium text-white transition-colors hover:bg-[#276b50] sm:w-auto"
            >
              <IoHomeOutline size={18} />
              بازگشت به خانه
              <MdOutlineKeyboardArrowLeft size={20} />
            </Link>
            <Link
              href="/products"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#F4C111] px-5 py-3.5 text-sm font-medium text-[#1F3A2A] transition-colors hover:bg-[#E5B40A] sm:w-auto"
            >
              مشاهده محصولات
              <MdOutlineKeyboardArrowLeft size={20} />
            </Link>
          </motion.div>

          <motion.ul
            variants={fadeUp}
            custom={5}
            className="mt-10 grid grid-cols-2 gap-2 sm:grid-cols-4"
          >
            {quickLinks.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="group flex flex-col items-center gap-2 rounded-2xl border border-[#E2EAE2] bg-white/70 px-3 py-4 text-[12px] text-[#5F6B64] transition-all hover:border-[#308060]/35 hover:bg-white hover:text-[#105238] hover:shadow-sm"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E8F1EA] text-[#308060] transition-colors group-hover:bg-[#308060] group-hover:text-white">
                    <Icon size={18} />
                  </span>
                  {label}
                </Link>
              </li>
            ))}
          </motion.ul>
        </motion.section>

        <motion.p
          variants={fadeUp}
          custom={6}
          initial="hidden"
          animate="visible"
          className="mt-6 text-center text-xs text-[#8A968F]"
        >
          اگر فکر می‌کنید این یک خطاست، با{' '}
          <Link href="/contact" className="text-[#308060] underline-offset-2 hover:underline">
            پشتیبانی
          </Link>{' '}
          تماس بگیرید.
        </motion.p>
      </div>
    </main>
  );
};

export default NotFoundPage;
