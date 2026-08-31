'use client';
import { useState } from 'react';
import { MdArrowDropDown } from 'react-icons/md';
import { useQueryManager } from '../../../utils/QueryManager';
import FarsiNumber from '../FarsiNumber';
import CategoryTreeFilter from '../filters/CategoryTreeFilter';
import { parseFilterSlugs } from '../../../utils/categories';

const DESKTOP_MIN = 768;

const FilterByCategories = ({ product_category, query, currentCategory }) => {
  const queryManager = useQueryManager();
  const activeQuery = query || queryManager;
  // موبایل: باتم‌شیت بسته؛ دسکتاپ: آکاردئون باز
  const [panelOpen, setPanelOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= DESKTOP_MIN;
  });
  const selectedSlugs = parseFilterSlugs(activeQuery.get('categories')).filter(
    (slug) => slug !== currentCategory?.slug
  );

  return (
    <div>
      <div
        onClick={() => setPanelOpen(!panelOpen)}
        className={`w-full  h-12 ${panelOpen ? 'rounded-t-lg' : 'rounded-lg'}  flex justify-between items-center text-[#353535] md:px-4 px-2 cursor-pointer bg-[#F4F4F4]`}
      >
        <p className='flex items-center gap-1.5'>
          <span className='hidden md:block'>فیلتر بر اساس</span> دسته‌بندی{' '}
          <span
            className={`w-[25px] h-[25px] rounded-full flex items-center justify-center text-white bg-green-600 ${selectedSlugs.length ? '' : 'hidden'}`}
          >
            <FarsiNumber>{selectedSlugs.length}</FarsiNumber>
          </span>
        </p>
        <MdArrowDropDown fontSize={25} color='#707070' />
      </div>
      <div
        className={` px-5 flex max-md:max-h-[70%] max-md:h-fit max-md:overflow-auto max-md:fixed max-md:w-full max-md:right-0 z-40 bottom-0 max-md:rounded-t-2xl rounded-b-none flex-col gap-3 py-3 bg-gray-200 md:rounded-b-2xl transition-all ${panelOpen ? 'h-auto max-h-[70vh] md:max-h-[800px] overflow-auto' : 'h-0! max-h-0 overflow-hidden py-0!'}`}
      >
        <CategoryTreeFilter
          categories={product_category}
          currentCategory={currentCategory}
          listPath='/products'
          query={activeQuery}
          allLabel='همه دسته‌بندی‌ها'
        />
      </div>
      {panelOpen ? (
        <div
          onClick={() => {
            setPanelOpen(false);
          }}
          className='bg-black/50 fixed md:hidden  top-0 right-0 w-screen h-screen z-30'
        ></div>
      ) : (
        ''
      )}
    </div>
  );
};

export default FilterByCategories;
