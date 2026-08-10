'use client';

import React, { useEffect, useState, Suspense } from 'react';
import PagesTitle from '../components/main/cards/PagesTitle';
import SearchBox from '../components/main/products/SearchBox.jsx';
import FilterByCategories from '../components/main/products/FilterByCategories.jsx';
import AvailableProducts from '../components/main/products/AvailableProducts.jsx';
import ProductCard from '../components/main/cards/ProductCard.jsx';
import { useQueryManager } from '../utils/QueryManager';
import { listProducts } from '../lib/data/stubs';
import { useIsMobile } from '../utils/UseIsMobile';

const Filters = ({ query, search, product_category, currentCategory }) => {
  return (
    <Suspense fallback={<div>در حال بارگذاری فیلترها...</div>}>

      <div className='flex md:flex-col gap-3 md:w-[350px]'>
        <SearchBox query={query} search={search} />
        <FilterByCategories currentCategory={currentCategory} product_category={product_category} query={query} />
        {/* <AvailableProducts query={query} /> */}
        <div className='md:hidden'>
          <Sort query={query} search={search} />
        </div>
      </div>

    </Suspense>
  );
};

const Title = () => (
  <PagesTitle
    alt="productsPageTitle"
    title={
      <p>
        فروشگاه آنلاین <span className='text-[#F4C111]'>کودهای خانگی</span>
      </p>
    }
  />
);

const Sort = ({ search, query }) => {
  return (
    <div className='flex text-nowrap gap-5 overflow-hidden justify-between items-center md:w-full w-fit md:mb-5'>
      <p className='text-lg font-extrabold text-[#353535] hidden md:block'>
        {search ? `جستجو برای "${search}"` : 'کودهای خانگی'}
      </p>
      <hr className='w-full border-dashed border-gray-400 hidden md:block' />
      <div className='text-[#353535] bg-[#F4F4F4] md:w-[200px] rounded-lg p-3 py-0 flex items-center gap-2 cursor-pointer'>
        <select
          className='outline-0 w-full md:py-3 py-[11px] rounded-2xl'
          value={query.get('sort') || 'newest'}
          onChange={(e) => query.set({ sort: e.target.value })}
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
  const categories = query.get('categories');
  const available = query.get('available');
  const search = query.get('search') || '';
  const [state, setState] = useState({
    products: [],
    loading: true,
  });

  // defaultQueries only once
  useEffect(() => {
    if (!sort) {
      query.set({ sort: 'newest' });
    }
  }, []);

  const getProducts = async () => {
    setState((prev) => ({ ...prev, loading: true }));

    const sortRegister = {
      newest: '-createdAt',
      oldest: 'createdAt',
    };

    const filterRegister = ({ categories, status }) => ({
      status: 'AVAILABLE',
      ...(currentCategory && { 'category_id.slug': { $in: [currentCategory.slug] } }),
      ...(categories && { 'category_id.slug': { $in: categories?.split(' ')?.map(item => item) } })
      // اگر خواستی بعدا کد دسته‌بندی رو فعال می‌کنم
    });

    try {
      const res = await listProducts({
        sort: sortRegister[sort || 'newest'],
        search,
        filters: filterRegister({ categories, status: available }),
      });

      setState({ products: res.content, loading: false });
    } catch (error) {
      console.log(error);
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  // fetch only when actual params change
  useEffect(() => {
    if (!sort) return; // تا وقتی defaultQuery ست نشده fetch نزن
    getProducts();
  }, [sort, categories, available, search]);
  const isMobile = useIsMobile(767)
  return (
    <div className='md:mt-10 max-w-7xl mx-auto'>
      <Title />
      <div className='flex md:flex-row flex-col gap-5 my-10 md:max-w-7xl mx-3! md:mx-auto'>
        <Filters query={query} search={search} currentCategory={currentCategory} product_category={product_category} />
        <div className='md:w-[calc(100%-350px)]'>
          {isMobile ? '' : <div className='hidden md:block'><Sort search={search} query={query} /></div>}

          <div className='flex gap-6 flex-wrap justify-center md:justify-start'>
            {(state.loading ? [1, 2, 3, 4] : state?.products)?.map((product, index) => (
              <ProductCard
                key={product?._id || index}
                loading={state.loading}
                image={product?.thumbnail_id?.[0]?.url}
                title={product?.title}
                slug={product?.slug}
                category={product?.category_id?.[0]?.title}
              />
            ))}
          </div>
          {
            (!state.loading && !state.products?.length) ?
              <p>محصولی یافت نشد</p>
              : ''
          }
        </div>
      </div>
      <div className={`bg-[#F5F5F5] p-10 rounded-3xl ${currentCategory ? '' : 'hidden'}`} dangerouslySetInnerHTML={{ __html: currentCategory?.description || '' }} />
    </div>
  );
};

export default ProductsPage;
