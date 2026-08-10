'use client';
import PagesTitle from '../components/main/cards/PagesTitle';
import SearchBox from '../components/main/products/SearchBox';
import Link from 'next/link';
import Image from 'next/image';
import MediaTitle from '../components/main/modules/MediaTitle/MediaTitle'
import { FaArrowLeft } from "react-icons/fa6";
import { FaCalendarAlt } from "react-icons/fa";
import Pagination from '../components/main/modules/pagination/Pagination'
import { useQueryManager } from '../utils/QueryManager';
import { useEffect, useState } from 'react';
import { listBlogs, mediaUrl } from '../lib/data/stubs';
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
                <ul className='mt-3'>
                 {
                    parentCategories?.length ? parentCategories?.map(item=>{
                        return (
                            <li key={item._id}>
                            <Link href={`/blogs/${item.slug}`} className={` ${currentCategory?.slug === item.slug ? 'text-green-900!' :''} flex text-[#242424] items-center justify-between py-2`}>
                                {item.title}
    
                                <div className='text-sm font-["fontfanum"] text-gray-500 border w-7 h-7 rounded-md flex items-center justify-center  border-[#BEDACC]'>
                                    5
                                </div>
    
                            </Link>
                        </li>
                        )
                    }):''
                 }
               
                </ul>
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
      detail:{page:1,limit:20,totalPages:1}
    });
  
    // defaultQueries only once
    useEffect(() => {
        
     
        if(!sort){
            query.set({ sort: 'newest' , page:1 });
        }else{
            query.set({  page:1 });
        }
    
   

    
 
    }, []);
  
    const getBlogs = async () => {
      setState((prev) => ({ ...prev, loading: true }));
  
      const sortRegister = {
        newest: '-createdAt',
        oldest: 'createdAt',
      };
  
      const filterRegister = ({ categories, status }) => ({
         status: 'published',
       
        ...(currentCategory && {category_id : currentCategory._id})
        // اگر خواستی بعدا کد دسته‌بندی رو فعال می‌کنم
      });
  
 
      
      try {
        const res = await listBlogs({
          sort: sortRegister[sort || 'newest'],
          search,
          filters: filterRegister({ categories, status: available }),
        });

        setState((prev) => ({ ...prev, blogs: res.content, loading: false }));
      } catch (error) {
        setState((prev) => ({ ...prev, loading: false }));
      }
    };
  
    // fetch only when actual params change
    useEffect(() => {
      if (!sort) return; // تا وقتی defaultQuery ست نشده fetch نزن
      getBlogs();
    }, [sort, categories, available, search ,page]);
  
    
  
    return (
        <div className='min-h-screen max-w-7xl lg:mx-auto md:mx-3 mt-0 md:my-10'>
            <Title />
            <div className='flex flex-col lg:flex-row gap-5 mx-3 '>
                <Filters currentCategory={currentCategory} parentCategories={parentCategories} />
                <div className='md:w-[calc(100%-350px)]  '>
                    <Sort search={search} />
                    <div className='flex gap-6 flex-wrap w-full justify-between '>
                        {
                            ( (state?.loading ) ? [1, 2, 3] : state?.blogs)?.map((blog, index) => (
                                <MediaTitle
                                 className='w-full'
                                loading={state.loading}
                                    wrapperClassName='bg-gray-100 w-full  md:p-5 p-3 rounded-2xl gap-1! md:gap-3!'
                                   key={index}
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
                                                className: ` md:w-[250px] w-[110px]  aspect-[2/1.5] self-center rounded-2xl md:h-[170px] ms-2`


                                            } :{
                                               
                                                component:  Image,
                                                props: {
                                                    
                                                    src: blog?.thumbnail_id?.[0]?.url ? mediaUrl(blog?.thumbnail_id?.[0]?.url) : '/blog1.png',
                                                    alt: 'blog1',
                                                    width: 500, height: 400,
                                                },

                                                className: ` md:w-[250px] w-[110px]  aspect-[2/1.5] self-center rounded-2xl md:h-[170px] ms-2`
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
                    <Pagination
                        ButtonClassName='bg-gray-100 rounded-lg  '
                        activeButtonClassName='bg-green-800 text-[#fff] rounded-lg'
                        className={'mt-5 justify-self-end w-fit mb-2!'}
                        navigationButtonClass='p-2 bg-gray-200 rounded-xl'
                        NextButton={'بعدی'}
                        PrevButton={'قبلی'}
                        totalPages={state.detail?.totalPages} />
                </div>
                
            </div>
        </div>
    );
};

export default BlogsPage;