'use client';

import { IoClose } from 'react-icons/io5';
import { HiOutlineTrash } from 'react-icons/hi2';
import {
  findCategoryBySlug,
  nestCategories,
  parseFilterSlugs,
  serializeFilterSlugs,
  toggleFilterSlug,
} from '../../../utils/categories';

const Chip = ({ label, onRemove, ariaLabel }) => (
  <span className='inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#E6E6E6] bg-white py-1 pr-3 pl-1 text-[12px] text-[#353535] shadow-[0_1px_2px_rgba(0,0,0,0.04)]'>
    <span className='truncate'>{label}</span>
    <button
      type='button'
      onClick={onRemove}
      aria-label={ariaLabel || `حذف ${label}`}
      className='flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[#707070] transition-colors hover:bg-red-50 hover:text-red-600'
    >
      <IoClose size={14} />
    </button>
  </span>
);

const ActiveFilters = ({
  categories,
  currentCategory,
  query,
  search = '',
  listPath = '/products',
}) => {
  const tree = nestCategories(categories);
  const pageSlug = currentCategory?.slug;
  // فقط فیلترهای query — دستهٔ صفحه اختصاصی تگ فیلتر نیست
  const filterSlugs = parseFilterSlugs(query.get('categories')).filter(
    (slug) => slug !== pageSlug
  );
  const hasSearch = Boolean(search);
  const hasFilters = filterSlugs.length > 0 || hasSearch;

  if (!hasFilters) return null;

  const applySlugs = (slugs) => {
    const unique = serializeFilterSlugs(
      slugs.filter((slug) => slug !== pageSlug)
    );
    query.set({
      categories: unique.length ? unique.join(',') : undefined,
      page: 1,
    });
  };

  const clearAll = () => {
    // روی صفحه اختصاصی دسته بمان؛ فقط فیلترهای اضافه پاک شوند
    if (pageSlug) {
      query.set({ categories: undefined, search: undefined, page: 1 });
      return;
    }
    query.set(
      {
        categories: undefined,
        search: undefined,
        page: 1,
      },
      { targetUrl: listPath }
    );
  };

  return (
    <div className='mb-4 flex flex-wrap items-center gap-2'>
      {hasSearch ? (
        <Chip
          label={`جستجو: ${search}`}
          ariaLabel='حذف جستجو'
          onRemove={() => query.set({ search: undefined, page: 1 })}
        />
      ) : null}
      {filterSlugs.map((slug) => {
        const category = findCategoryBySlug(tree, slug);
        const title = category?.title || slug;
        return (
          <Chip
            key={slug}
            label={title}
            ariaLabel={`حذف فیلتر ${title}`}
            onRemove={() => applySlugs(toggleFilterSlug(filterSlugs, slug))}
          />
        );
      })}
      <button
        type='button'
        onClick={clearAll}
        className='inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium text-red-600 transition-colors hover:bg-red-50'
      >
        <HiOutlineTrash size={15} />
        حذف همه فیلترها
      </button>
    </div>
  );
};

export default ActiveFilters;
