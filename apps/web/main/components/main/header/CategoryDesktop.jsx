'use client'
import Link from "next/link";
import { useState, useRef } from "react";
import { IoIosArrowBack } from "react-icons/io";
import { SlugifyFilter as Slugify } from '../../../utils/helper'
const CategoryDesktop = ({ categories }) => {
  const [state, setState] = useState({ currentSubs: [], currentCat: {} });
  const hoverTimeout = useRef(null);



  return (
    <div
      onMouseLeave={() => {
        clearTimeout(hoverTimeout.current);
        setState(prev => ({ ...prev, currentSubs: [], currentCat: {} }));
      }}
      className="absolute hidden h-fit md:block group-hover:top-10  w-fit group-hover:opacity-100 duration-250 transition-all opacity-0 group-hover:visible invisible bg-white right-70 z-10 border top-20 border-[#EBEBEB] rounded-lg shadow-lg"
    >
      <div className="flex h-fit justify-between items-start  m-auto py-3 pr-0 px-3 w-full">
        <ul
          dir="ltr"
          className="flex pr-2  min-w-fit max-h-[60vh] h-fit gap-2 flex-col text-[#333] text-sm font-medium overflow-auto"
        >
          {categories?.map((category, i) => (
            <li
              dir="rtl"
              key={category._id}
              onMouseEnter={() => {
                clearTimeout(hoverTimeout.current);
                hoverTimeout.current = setTimeout(() => {
                  setState(prev => ({
                    ...prev,
                    currentCat: category,
                    currentSubs: category.children
                  }));
                }, 100);
              }}
              className={` ${state.currentCat._id === category._id ? 'bg-[#DDF4EA] text-[#009180]' : ''}  transition-colors p-2 px-3 cursor-pointer flex items-center justify-between gap-5 rounded-lg`}
            >
              <Link
                className="w-full flex items-center gap-4 justify-between"
                href={`/products/${category.slug}?page=1`}
              >
                {category.title} <IoIosArrowBack />
              </Link>
            </li>
          ))}
        </ul>

        <ul
          className={` ${state.currentSubs?.length ? "px-3 w-full" : "px-0 w-0"
            } flex flex-wrap gap-2  text-[#333] h-fit text-sm w-full! font-medium`}
        >

          {state?.currentSubs.length ? state?.currentSubs?.map(category => (
            <div key={category._id || category.title}>
              <li className="hover:bg-[#F4C11150]  rounded-s-none  border-s-2 border-[#F4C111] py-2 h-fit transition-colors  px-3 cursor-pointer gap-5 rounded-lg">
                <Link
                  className="w-full text-sm font-bold flex items-center gap-4 justify-between"
                  href={`/products/${Slugify(state.currentCat.slug)}/${Slugify(category.slug)}?page=1`}
                >
                  {category?.title}
                </Link>
              </li>

              {category?.children?.map(cat => (
                <Link
                  href={`/products/${Slugify(category.slug)}/${Slugify(cat.slug)}?page=1`}


                  className="p-3 block py-3 text-xs text-gray-600 font-normal"
                  key={cat._id}
                >
                  {cat.title}
                </Link>
              ))}
            </div>
          )) : ''}

        </ul>
      </div>
    </div>
  );
};

export default CategoryDesktop;
