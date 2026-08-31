'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { FaCheck } from 'react-icons/fa';
import { IoIosArrowDown } from 'react-icons/io';
import { useQueryManager } from '../../../utils/QueryManager';
import {
  ancestorIdsForSlug,
  catId,
  nestCategories,
  parseFilterSlugs,
  selectedFilterSlugs,
  serializeFilterSlugs,
  toggleFilterSlug,
} from '../../../utils/categories';

const CategoryRow = ({
  category,
  selectedSlugs,
  openIds,
  toggleOpen,
  onToggle,
  pageSlug,
}) => {
  const children = category.children || [];
  const hasChildren = children.length > 0;
  const id = catId(category);
  const isOpen = openIds.has(id);
  const isPageCategory = Boolean(pageSlug) && category.slug === pageSlug;
  const isActive = isPageCategory || selectedSlugs.includes(category.slug);

  return (
    <div>
      <div
        className={`flex items-center gap-2 rounded-xl ${
          isPageCategory ? 'bg-white/80 px-2 py-1.5 ring-1 ring-[#105238]/15' : ''
        }`}
      >
        {isPageCategory ? (
          <div className='flex min-w-0 flex-1 items-center gap-3 md:gap-4 text-right'>
            <div className='flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-green-900 bg-[#105238]'>
              <FaCheck className='p-0.5' color='#fff' />
            </div>
            <div className='min-w-0'>
              <p className='text-sm font-bold text-green-900'>{category.title}</p>
              <p className='text-[11px] text-[#6b8578]'>صفحه این دسته‌بندی</p>
            </div>
          </div>
        ) : (
          <button
            type='button'
            onClick={() => onToggle(category.slug)}
            className='flex min-w-0 flex-1 items-center gap-3 md:gap-4 cursor-pointer text-right'
          >
            <div className='border border-green-900 h-7 w-7 flex items-center justify-center rounded-md shrink-0 bg-white'>
              {isActive ? <FaCheck className='p-0.5' color='#1A3D39' /> : ''}
            </div>
            <p className={`text-sm ${isActive ? 'font-bold text-green-900' : ''}`}>
              {category.title}
            </p>
          </button>
        )}
        {hasChildren ? (
          <button
            type='button'
            aria-expanded={isOpen}
            aria-label={isOpen ? 'بستن زیردسته‌ها' : 'باز کردن زیردسته‌ها'}
            onClick={() => toggleOpen(id)}
            className='flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#707070] hover:bg-black/5'
          >
            <IoIosArrowDown
              size={16}
              className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            />
          </button>
        ) : null}
      </div>
      {hasChildren && isOpen ? (
        <div className='mt-2 mr-3 flex flex-col gap-2 border-r border-dashed border-gray-400 pr-4'>
          {children.map((child) => (
            <CategoryRow
              key={catId(child) || child.slug}
              category={child}
              selectedSlugs={selectedSlugs}
              openIds={openIds}
              toggleOpen={toggleOpen}
              onToggle={onToggle}
              pageSlug={pageSlug}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
};

const CategoryTreeFilter = ({
  categories,
  currentCategory,
  listPath,
  query,
  allLabel = 'همه دسته‌بندی‌ها',
}) => {
  const queryManager = useQueryManager();
  const activeQuery = query || queryManager;
  const tree = useMemo(() => nestCategories(categories), [categories]);
  const pageSlug = currentCategory?.slug;
  // فیلترهای واقعی فقط از query؛ دسته صفحه اختصاصی فیلتر نیست
  const filterSlugs = parseFilterSlugs(activeQuery.get('categories')).filter(
    (slug) => slug !== pageSlug
  );
  const openContextSlugs = pageSlug
    ? [...new Set([pageSlug, ...filterSlugs])]
    : selectedFilterSlugs(activeQuery.get('categories'), null);

  const [openIds, setOpenIds] = useState(() => {
    const ids = new Set();
    for (const slug of openContextSlugs) {
      (ancestorIdsForSlug(tree, slug) || []).forEach((id) => ids.add(id));
    }
    return ids;
  });

  useEffect(() => {
    if (!openContextSlugs.length) return;
    setOpenIds((prev) => {
      const next = new Set(prev);
      let changed = false;
      for (const slug of openContextSlugs) {
        for (const id of ancestorIdsForSlug(tree, slug) || []) {
          if (!next.has(id)) {
            next.add(id);
            changed = true;
          }
        }
      }
      return changed ? next : prev;
    });
  }, [openContextSlugs.join(','), tree]);

  const toggleOpen = (id) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const applySlugs = (slugs) => {
    const unique = serializeFilterSlugs(
      slugs.filter((slug) => slug !== pageSlug)
    );
    if (pageSlug && !unique.length) {
      activeQuery.set({ categories: undefined, page: 1 });
      return;
    }
    activeQuery.set(
      {
        categories: unique.length ? unique.join(',') : undefined,
        page: 1,
      },
      { targetUrl: listPath }
    );
  };

  const onToggle = (slug) => {
    if (slug === pageSlug) return;
    applySlugs(toggleFilterSlug(filterSlugs, slug));
  };

  return (
    <div className='flex flex-col gap-3'>
      {pageSlug ? (
        <Link
          href={listPath || '/products'}
          className='flex items-center gap-3 md:gap-4 text-right text-sm text-[#4a6b5c] transition-colors hover:text-[#105238]'
        >
          <div className='flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-dashed border-green-900/40 bg-white' />
          <span>{allLabel}</span>
        </Link>
      ) : (
        <button
          type='button'
          onClick={() => applySlugs([])}
          className='flex items-center gap-3 md:gap-4 cursor-pointer text-right'
        >
          <div className='border border-green-900 h-7 w-7 flex items-center justify-center rounded-md bg-white'>
            {!filterSlugs.length ? (
              <FaCheck className='p-0.5' color='#1A3D39' />
            ) : (
              ''
            )}
          </div>
          <p
            className={`text-sm ${!filterSlugs.length ? 'font-bold text-green-900' : ''}`}
          >
            {allLabel}
          </p>
        </button>
      )}
      {tree.map((category) => (
        <CategoryRow
          key={catId(category) || category.slug}
          category={category}
          selectedSlugs={filterSlugs}
          openIds={openIds}
          toggleOpen={toggleOpen}
          onToggle={onToggle}
          pageSlug={pageSlug}
        />
      ))}
    </div>
  );
};

export default CategoryTreeFilter;
export { selectedFilterSlugs };
