import React from 'react';
import ShowAllBtn from '../modules/ShowAllBtn';
import BlogCard from '../../../components/main/cards/BlogCard';
import Slider from '../modules/Slider';

const NewestBlog = ({ blogs = [], cms } = {}) => {
  const eyebrow = cms?.eyebrow || 'اخبار و مقالات';
  const title = cms?.title || 'جدیدترین اخبار و مقالات';
  const showAllHref = cms?.showAllHref || '/blogs';
  const list = Array.isArray(blogs) ? blogs : [];

  return (
    <div className="max-w-7xl lg:mx-auto mx-3 my-20 overflow-x-clip min-w-0">
      <div className="flex items-center justify-between">
        <div>
          <p>{eyebrow}</p>
          <p className="text-xl font-extrabold">{title}</p>
        </div>
        <ShowAllBtn href={showAllHref} />
      </div>
      {list.length ? (
        <Slider
          width={280}
          gap={25}
          className="mt-10 !h-[430px]"
          slides={list.map((item, index) => (
            <BlogCard key={item.id || index} data={item} />
          ))}
        />
      ) : (
        <p className="mt-10 rounded-xl bg-[#F8F8F8] p-6 text-center text-sm text-black/60">
          هنوز مطلبی برای این بخش پیدا نشد.
        </p>
      )}
    </div>
  );
};

export default NewestBlog;
