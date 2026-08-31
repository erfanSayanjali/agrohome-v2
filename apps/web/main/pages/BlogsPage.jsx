'use client';
import PagesTitle from '../components/main/cards/PagesTitle';
import SearchBox from '../components/main/products/SearchBox';
import Image from 'next/image';
import MediaTitle from '../components/main/modules/MediaTitle/MediaTitle'
import { FaArrowLeft } from "react-icons/fa6";
import { FaCalendarAlt } from "react-icons/fa";
import Pagination from '../components/main/modules/pagination/Pagination'
import { useQueryManager } from '../utils/QueryManager';
import { useEffect, useState } from 'react';
import { listBlogs, mediaUrl } from '../lib/data/stubs';
import CategoryTreeFilter from '../components/main/filters/CategoryTreeFilter';
import {
  expandSelectedIds,
  nestCategories,
  selectedFilterSlugs,
} from '../utils/categories';
import EmptyState from '../components/main/empty/EmptyState';
const Title = () => {
    return (
        <PagesTitle
            imagePosition={''}
            image={'/b.jpg'}
            alt={'aboutUs'}
            title={
                <p>
                    وبلاگ <span className='text-[#F4C111]'>آگروهوم</span>
                </p>
            }
        />
    )
}
const Filters = ({parentCategories , currentCategory}) => {
    const query = useQueryManager()
    return (
        <div className='flex flex-col gap-3 md:w-[350px]'>
            <SearchBox  placeholder={' جستجو در وبلاگ‌ها ...' } query={query} search={query.get('search')}/>
            <div className='bg-[#F3F3F3] p-5 pt-0 rounded-2xl '>
                <p className='border-b font-extrabold border-dashed py-4'>
                    موضوعات وبلاگ
                </p>
                <div className='mt-3'>
                    <CategoryTreeFilter
                        categories={parentCategories}
                        currentCategory={currentCategory}
                        listPath='/blogs'
                        query={query}
                        allLabel='همه موضوعات'
                    />
                </div>
            </div>
        </div>
    )
}
const Sort = ({search}) => {
    const query = useQueryManager()
    return (
        <div className='flex text-nowrap gap-5 justify-between items-center w-full mb-5 '>
            <p className='text-lg font-extrabold text-[#353535]'>
                {search ? `نتیجه جستجو ${search}` : 'مقالات'}
            </p>
            <hr className='md:w-full border-dashed border-gray-400' />
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
    )
}
const BlogsPage = ({currentCategory = null , parentCategories}) => {
    const query = useQueryManager();
    const sort = query.get('sort');
    const page = query.get('page');
    const categories = query.get('categories');
    const available = query.get('available');
    const search = query.get('search') || '';
    const [state, setState] = useState({
      blogs: [],
      loading: true,
      refreshing: false,
      detail:{page:1,limit:12,totalPages:1}
    });
  
    // defaultQueries only once
    useEffect(() => {
        if(!sort){
            query.set({ sort: 'newest' , page: page || 1 });
        }
    }, []);
  
    const getBlogs = async () => {
      setState((prev) => ({
        ...prev,
        loading: prev.blogs.length === 0,
        refreshing: prev.blogs.length > 0,
      }));
  
      const sortRegister = {
        newest: '-createdAt',
        oldest: 'createdAt',
      };
  
      const currentPage = Math.max(1, Number(page) || 1);
      const tree = nestCategories(parentCategories);
      const selectedSlugs = selectedFilterSlugs(categories, currentCategory?.slug);
      const categoryIds = expandSelectedIds(tree, selectedSlugs);
      const filters = {
        ...(categoryIds.length ? { categoryIds } : {}),
      };
      
      try {
        const res = await listBlogs({
          sort: sortRegister[sort || 'newest'],
          search,
          page: currentPage,
          limit: 12,
          filters,
        });

        setState((prev) => ({
          ...prev,
          blogs: res.content || [],
          loading: false,
          refreshing: false,
          detail: {
            page: res.meta?.page || currentPage,
            limit: res.meta?.limit || 12,
            totalPages: res.meta?.totalPages || 1,
          },
        }));
      } catch (error) {
        setState((prev) => ({ ...prev, loading: false, refreshing: false }));
      }
    };
  
    // fetch only when actual params change
    useEffect(() => {
      if (!sort) return; // تا وقتی defaultQuery ست نشده fetch نزن
      getBlogs();
    }, [sort, categories, available, search, page, currentCategory?._id, currentCategory?.id]);
  
    
  
    return (
        <div className='min-h-screen max-w-7xl lg:mx-auto md:mx-3 mt-0 md:my-10'>
            <Title />
            <div className='flex flex-col lg:flex-row gap-5 mx-3 '>
                <Filters currentCategory={currentCategory} parentCategories={parentCategories} />
                <div className='md:w-[calc(100%-350px)]  '>
                    <Sort search={search} />
                    {state.loading || state.blogs?.length ? (
                    <div
                      className={`flex gap-6 flex-wrap w-full justify-between transition-opacity duration-200 ${state.refreshing ? 'pointer-events-none opacity-60' : ''}`}
                      aria-busy={state.refreshing}
                    >
                        {
                            (state.loading ? [1, 2, 3] : state.blogs)?.map((blog, index) => (
                                <MediaTitle
                                 className='w-full'
                                loading={state.loading}
                                    wrapperClassName='bg-gray-100 w-full  md:p-5 p-3 rounded-2xl gap-1! md:gap-3!'
                                   key={state.loading ? index : (blog._id || blog.id || blog.slug || index)}
                                    isLink={!state.loading} href={`/blog/${blog.slug}`   } Tag='article'
                                    data={
                                        {
                                            title: { content: blog.title , tag: 'h3' },
                                            date: {
                                                tag: 'span',
                                                content: <>
                                                    <FaCalendarAlt />
                                                    {new Date(blog.createdAt).toLocaleDateString('fa-IR')}
                                                </>,
                                                priority: 2,

                                                className: 'h-fit flex gap-2  items-center text-xs md:text-base text-gray-600'
                                            },
                                            description: {
                                                content: blog.subTitle,
                                                className: '!line-clamp-2 h-fit text-sm md:text-base '
                                            },
                                            mediaElement: state.loading ? {content:'',
                                                className: ` md:w-[250px] w-[110px]  aspect-[2/1.5] self-center rounded-2xl md:h-[170px] ms-2 object-cover`


                                            } :{
                                               
                                                component:  Image,
                                                props: {
                                                    
                                                    src: blog?.thumbnail_id?.[0]?.url ? mediaUrl(blog?.thumbnail_id?.[0]?.url) : '/blog1.png',
                                                    alt: 'blog1',
                                                    width: 500, height: 400,
                                                },

                                                className: ` md:w-[250px] w-[110px]  aspect-[2/1.5] self-center rounded-2xl md:h-[170px] ms-2 object-cover`
                                            },
                                            actionBottom: {
                                                className: ' justify-self-end hidden md:flex      items-center gap-2',
                                                content: <>
                                                    ادامه مطلب
                                                    <FaArrowLeft color='#fff' className='box-content p-2 rounded-full bg-green-900' />
                                                </>
                                            }
                                        }
                                    } />


                            ))
                        }
                    </div>
                    ) : (
                      <EmptyState
                        variant='blogs'
                        search={search}
                        categoryTitle={currentCategory?.title}
                        hasFilters={Boolean(search || categories || currentCategory)}
                        onClearFilters={() =>
                          query.set(
                            { categories: undefined, search: undefined, page: 1 },
                            { targetUrl: '/blogs' }
                          )
                        }
                      />
                    )}
                    {state.loading || state.blogs?.length ? (
                    <Pagination
                        className="mt-8 mb-3"
                        NextButton="بعدی"
                        PrevButton="قبلی"
                        totalPages={state.detail?.totalPages}
                    />
                    ) : null}
                </div>
                
            </div>
        </div>
    );
};

export default BlogsPage;