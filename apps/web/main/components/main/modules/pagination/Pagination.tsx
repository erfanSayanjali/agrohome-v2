'use client';

import { JSX, useCallback, useEffect, useState } from 'react';
import { useQueryManager } from '../../../../utils/QueryManager';
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from 'react-icons/md';

type Buttons = JSX.Element | string;

type props = {
  className?: string;
  totalPages: number;
  NextButton?: Buttons;
  PrevButton?: Buttons;
  navigationButtonClass?: string;
  activeButtonClassName?: string;
  ButtonClassName?: string;
  ellipsisClassName?: string;
  ellipsis?: Buttons;
};

type NavProps = {
  PrevButton?: React.ReactNode;
  NextButton?: React.ReactNode;
  navigationButtonClass?: string;
  currentPage: number;
  totalPages: number;
  query: {
    set: (v: Record<string, any>, options?: { replace?: boolean; scroll?: boolean }) => void;
  };
};

const pageBase =
  'fanum relative inline-flex h-10 min-w-10 items-center justify-center rounded-xl text-sm font-bold transition-all duration-200 select-none';

const PreviousButton = ({
  PrevButton,
  navigationButtonClass,
  currentPage,
  query,
}: NavProps) => {
  const disabled = currentPage <= 1;
  const goPrev = () => {
    if (!disabled) query.set({ page: currentPage - 1 }, { replace: true, scroll: false });
  };

  if (PrevButton !== undefined) {
    return (
      <button
        type="button"
        disabled={disabled}
        aria-label="صفحه قبل"
        onClick={goPrev}
        className={
          navigationButtonClass ||
          `${pageBase} gap-1 bg-white px-3 text-[#353535] ring-1 ring-[#E5E5E5] hover:bg-[#105238] hover:text-white hover:ring-[#105238] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-[#353535] disabled:hover:ring-[#E5E5E5]`
        }
      >
        <MdKeyboardArrowRight fontSize={20} />
        <span className="hidden sm:inline">{PrevButton}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      aria-label="صفحه قبل"
      onClick={goPrev}
      className={`${pageBase} bg-[#105238] text-white shadow-sm hover:bg-[#0c3f2b] disabled:cursor-not-allowed disabled:opacity-40`}
    >
      <MdKeyboardArrowRight fontSize={22} />
    </button>
  );
};

const NextButtonMain = ({
  NextButton,
  navigationButtonClass,
  currentPage,
  totalPages,
  query,
}: NavProps) => {
  const disabled = currentPage >= totalPages;
  const goNext = () => {
    if (!disabled) query.set({ page: currentPage + 1 }, { replace: true, scroll: false });
  };

  if (NextButton !== undefined) {
    return (
      <button
        type="button"
        disabled={disabled}
        aria-label="صفحه بعد"
        onClick={goNext}
        className={
          navigationButtonClass ||
          `${pageBase} gap-1 bg-white px-3 text-[#353535] ring-1 ring-[#E5E5E5] hover:bg-[#105238] hover:text-white hover:ring-[#105238] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-[#353535] disabled:hover:ring-[#E5E5E5]`
        }
      >
        <span className="hidden sm:inline">{NextButton}</span>
        <MdKeyboardArrowLeft fontSize={20} />
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      aria-label="صفحه بعد"
      onClick={goNext}
      className={`${pageBase} bg-[#105238] text-white shadow-sm hover:bg-[#0c3f2b] disabled:cursor-not-allowed disabled:opacity-40`}
    >
      <MdKeyboardArrowLeft fontSize={22} />
    </button>
  );
};

function buildPages(current: number, total: number): Array<number | 'start-ellipsis' | 'end-ellipsis'> {
  const pages: Array<number | 'start-ellipsis' | 'end-ellipsis'> = [];

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
    return pages;
  }

  pages.push(1);

  if (current > 3) pages.push('start-ellipsis');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push('end-ellipsis');

  pages.push(total);
  return pages;
}

function Pagination({
  totalPages,
  ButtonClassName,
  activeButtonClassName,
  navigationButtonClass,
  NextButton,
  PrevButton,
  className = '',
  ellipsisClassName,
}: props) {
  const query = useQueryManager();
  const [currentPage, setCurrentPage] = useState(1);
  const total = Math.max(0, Number(totalPages) || 0);

  const updatePage = useCallback(() => {
    const current = Math.max(1, Number(query.get('page')) || 1);
    setCurrentPage(current);
  }, [query]);

  useEffect(() => {
    updatePage();
  }, [updatePage, query.get('page')]);

  if (total <= 1) return null;

  const pages = buildPages(currentPage, total);

  return (
    <nav
      aria-label="صفحه‌بندی"
      className={`flex w-full items-center justify-center ${className}`}
    >
      <div className="inline-flex items-center gap-1.5 rounded-2xl bg-[#F7F7F7]/80 p-1.5 ring-1 ring-[#E8E8E8] backdrop-blur-sm sm:gap-2 sm:p-2">
        <PreviousButton
          PrevButton={PrevButton}
          currentPage={currentPage}
          navigationButtonClass={navigationButtonClass}
          query={query}
          totalPages={total}
        />

        <div className="mx-0.5 flex items-center gap-1 sm:mx-1 sm:gap-1.5">
          {pages.map((p, idx) => {
            if (p === 'start-ellipsis' || p === 'end-ellipsis') {
              return (
                <span
                  key={`${p}-${idx}`}
                  aria-hidden
                  className={
                    ellipsisClassName ||
                    'fanum inline-flex h-10 min-w-6 items-center justify-center px-0.5 text-sm font-bold text-[#9A9A9A]'
                  }
                >
                  …
                </span>
              );
            }

            const isActive = p === currentPage;

            return (
              <button
                type="button"
                key={p}
                aria-label={`صفحه ${p}`}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => {
                  if (!isActive) query.set({ page: p }, { replace: true, scroll: false });
                }}
                className={
                  isActive
                    ? activeButtonClassName ||
                      `${pageBase} bg-[#105238] text-white shadow-[0_6px_16px_rgba(16,82,56,0.28)]`
                    : ButtonClassName ||
                      `${pageBase} bg-white text-[#353535] ring-1 ring-[#E5E5E5] hover:bg-[#105238]/8 hover:text-[#105238] hover:ring-[#105238]/30`
                }
              >
                {p.toLocaleString('fa-IR')}
              </button>
            );
          })}
        </div>

        <NextButtonMain
          NextButton={NextButton}
          currentPage={currentPage}
          navigationButtonClass={navigationButtonClass}
          query={query}
          totalPages={total}
        />
      </div>
    </nav>
  );
}

export default Pagination;
