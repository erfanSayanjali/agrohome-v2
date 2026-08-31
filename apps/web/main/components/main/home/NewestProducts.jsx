'use client'
import React from 'react';
import ShowAllBtn from '../modules/ShowAllBtn';
import Image from 'next/image';
import Slider from '../modules/Slider';
import ProductCard from '../cards/ProductCard';

const NewestProducts = ({ products = [], cms } = {}) => {
  const eyebrow = cms?.eyebrow || 'فروشگاه آگروهوم';
  const title = cms?.title || 'جدیدترین محصولات';
  const showAllHref = cms?.showAllHref || '/products';
  const list = Array.isArray(products) ? products : [];

  return (
    <div className="my-20 relative overflow-x-clip">
      <Image
        className="pointer-events-none absolute top-[-400px] right-0 -z-10 h-[400px] w-auto"
        width={200}
        height={100}
        alt=""
        aria-hidden
        src="/shape1.svg"
      />
      <div className="flex justify-between items-center mb-6 max-w-7xl lg:mx-auto mx-3">
        <div className="flex flex-col gap-1">
          <p>{eyebrow}</p>
          <p className="text-xl font-extrabold">{title}</p>
        </div>
        <ShowAllBtn href={showAllHref} text="مشاهده همه" />
      </div>
      <div className="relative">
        <Image
          src="/np.jpg"
          alt="newProductBackground"
          width={500}
          height={200}
          className="w-full -z-10 object-cover h-[180px] md:h-[220px] absolute top-0"
        />
        <div className="w-full h-[180px] md:h-[220px] -z-10 absolute top-0 bg-green-950/70" />
        <div className="max-w-7xl mx-auto pt-8 md:pt-10 px-3 md:px-0">
          {list.length ? (
            <Slider
              gap={16}
              width="fit-content"
              slides={list.map((product) => (
                <ProductCard
                  key={product.id || product.slug}
                  image={product?.thumbnail_id?.[0]?.url}
                  title={product?.title}
                  slug={product?.slug}
                  category={product?.category_id?.[0]?.title}
                />
              ))}
            />
          ) : (
            <p className="rounded-xl bg-white/90 p-6 text-center text-sm text-black/60">
              هنوز محصولی برای این بخش پیدا نشد.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewestProducts;
