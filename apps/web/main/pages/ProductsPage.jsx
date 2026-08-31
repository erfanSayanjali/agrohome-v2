'use client';

import React, { useEffect, useState, Suspense } from 'react';
import PagesTitle from '../components/main/cards/PagesTitle';
import SearchBox from '../components/main/products/SearchBox.jsx';
import FilterByCategories from '../components/main/products/FilterByCategories.jsx';
import ProductCard from '../components/main/cards/ProductCard.jsx';
import ActiveFilters from '../components/main/filters/ActiveFilters.jsx';
import { useQueryManager } from '../utils/QueryManager';
import { listProducts } from '../lib/data/stubs';
import {
  expandSelectedSlugs,
  nestCategories,
  parseFilterSlugs,
  selectedFilterSlugs,
} from '../utils/categories';
import { sanitizeHtml } from '../utils/sanitize';
import EmptyState from '../components/main/empty/EmptyState';
import Pagination from '../components/main/modules/pagination/Pagination';

const PAGE_SIZE = 24;

const Filters = ({ query, search, product_category, currentCategory }) => {
  return (
    <Suspense fallback={<div>در حال بارگذاری فیلترها...</div>}>

      <div className='flex md:flex-col gap-3 md:w-[280px] md:shrink-0'>
        <SearchBox query={query} search={search} />
        <FilterByCategories currentCategory={currentCategory} product_category={product_category} query={query} />
        {/* <AvailableProducts query={query} /> */}
        <div className='md:hidden'>
          <Sort query={query} search={search} currentCategory={currentCategory} />
        </div>
      </div>

    </Suspense>
  );
};

const Title = ({ currentCategory }) => (
  <PagesTitle
    flushBottom
    alt="productsPageTitle"
    title={
      currentCategory ? (
        <div>
          <p className="text-sm font-medium text-white/75 md:text-base">
            دسته‌بندی محصولات
          </p>
          <p className="mt-1">{currentCategory.title}</p>
        </div>
      ) : (
        <p>
          فروشگاه آنلاین <span className="text-[#F4C111]">کودهای خانگی</span>
        </p>
      )
    }
  />
);

const Sort = ({ search, query, currentCategory }) => {
  return (
    <div className='flex text-nowrap gap-5 overflow-hidden justify-between items-center md:w-full w-fit md:mb-5'>
      <p className='text-lg font-extrabold text-[#353535] hidden md:block'>
        {search
          ? `جستجو برای "${search}"`
          : currentCategory?.title || 'کودهای خانگی'}
      </p>
      <hr className='w-full border-dashed border-gray-400 hidden md:block' />
      <div className='text-[#353535] bg-[#F4F4F4] md:w-[200px] rounded-lg p-3 py-0 flex items-center gap-2 cursor-pointer'>
        <select
          className='outline-0 w-full md:py-3 py-[11px] rounded-2xl'
          value={query.get('sort') || 'newest'}
          onChange={(e) => query.set({ sort: e.target.value, page: 1 })}
        >
          <option value="newest">جدیدترین</option>
          <option value="oldest">قدیمی ترین</option>
        </select>
      </div>
    </div>
  );
};

const ProductsPage = ({ product_category, currentCategory = null }) => {
  const query = useQueryManager();
  const sort = query.get('sort');
  const page = query.get('page');
  const categories = query.get('categories');
  const available = query.get('available');
  const search = query.get('search') || '';
  const [state, setState] = useState({
    products: [],
    loading: true,
    error: false,
    detail: { page: 1, limit: PAGE_SIZE, totalPages: 1 },
  });

  // defaultQueries only once
  useEffect(() => {
    if (!sort) {
      query.set({ sort: 'newest', page: page || 1 });
    }
  }, []);

  useEffect(() => {
    if (!sort) return;

    let cancelled = false;

    const getProducts = async () => {
      setState((prev) => ({ ...prev, loading: true, error: false }));

      const sortRegister = {
        newest: '-createdAt',
        oldest: 'createdAt',
      };

      const tree = nestCategories(product_category);
      const selectedSlugs = selectedFilterSlugs(categories, currentCategory?.slug);
      const categorySlugs = expandSelectedSlugs(tree, selectedSlugs);
      const currentPage = Math.max(1, Number(page) || 1);

      try {
        const res = await listProducts({
          sort: sortRegister[sort || 'newest'],
          search,
          page: currentPage,
          limit: PAGE_SIZE,
          filters: {
            status: 'AVAILABLE',
            ...(categorySlugs.length ? { categorySlugs } : {}),
          },
        });

        if (cancelled) return;

        const total = res.total || 0;
        setState({
          products: res.content || [],
          loading: false,
          error: false,
          detail: {
            page: res.meta?.page || currentPage,
            limit: res.meta?.limit || PAGE_SIZE,
            totalPages:
              res.meta?.totalPages ||
              Math.max(1, Math.ceil(total / PAGE_SIZE)),
          },
        });
      } catch (error) {
        if (cancelled) return;
        console.error(error);
        setState((prev) => ({ ...prev, loading: false, error: true }));
      }
    };

    void getProducts();
    return () => {
      cancelled = true;
    };
  }, [sort, page, categories, available, search, currentCategory?.slug, product_category]);

  const extraFilterSlugs = parseFilterSlugs(categories).filter(
    (slug) => slug !== currentCategory?.slug
  );
  const hasExtraFilters = Boolean(search || extraFilterSlugs.length);

  return (
    <div className='md:mt-10 max-w-7xl mx-auto'>
      <Title currentCategory={currentCategory} />
      <div className='flex md:flex-row flex-col gap-5 my-10 md:max-w-7xl mx-3! md:mx-auto'>
        <Filters query={query} search={search} currentCategory={currentCategory} product_category={product_category} />
        <div className='min-w-0 flex-1'>
          <div className='mb-5 hidden md:block'>
            <Sort search={search} query={query} currentCategory={currentCategory} />
          </div>

          <ActiveFilters
            categories={product_category}
            currentCategory={currentCategory}
            query={query}
            search={search}
          />

          {state.error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
              خطا در بارگذاری محصولات. لطفاً دوباره تلاش کنید.
            </div>
          ) : state.loading || state.products?.length ? (
            <>
              <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4'>
                {(state.loading ? [1, 2, 3, 4, 5, 6, 7, 8] : state?.products)?.map((product, index) => (
                  <ProductCard
                    key={product?._id || index}
                    loading={state.loading}
                    fullWidth
                    image={product?.thumbnail_id?.[0]?.url}
                    title={product?.title}
                    slug={product?.slug}
                    category={product?.category_id?.[0]?.title}
                  />
                ))}
              </div>
              {state.loading || state.products?.length ? (
                <Pagination
                  className="mt-8 mb-3"
                  NextButton="بعدی"
                  PrevButton="قبلی"
                  totalPages={state.detail?.totalPages}
                />
              ) : null}
            </>
          ) : (
            <EmptyState
              variant='products'
              search={search}
              categoryTitle={currentCategory?.title}
              hasFilters={hasExtraFilters}
              onClearFilters={() =>
                query.set(
                  { categories: undefined, search: undefined, page: 1 },
                  currentCategory ? undefined : { targetUrl: '/products' }
                )
              }
            />
          )}
        </div>
      </div>
      <div className={`bg-[#F5F5F5] p-10 rounded-3xl ${currentCategory ? '' : 'hidden'}`} dangerouslySetInnerHTML={{ __html: sanitizeHtml(currentCategory?.description || '') }} />
    </div>
  );
};

export default ProductsPage;
