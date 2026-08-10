'use client'
import { useHash } from "../modules/useHash";
import { useScrollSpy } from "../modules/useScrollSpy";
import {motion} from 'framer-motion';
const Navigation = ({ NavigationItems , data }) => {
  const ids = NavigationItems.map(i => i.key);
  const activeId = useScrollSpy(ids);
  const hash = useHash();

  // انتخاب نهایی: اگر اسکرول در حال تغییر بود از activeId استفاده کن
  const current = activeId || hash.split('#')[1];

  return (
    <div className=" rounded-2xl shadow-2xl shadow-gray-100 mt-4 px-5 items-center sticky top-3 bg-white/80 backdrop-blur-md z-10 p-4"> 
      <div id="underline" className="flex md:gap-8 gap-3 text-xs md:text-base border-b border-gray-300 items-center">
        {NavigationItems.map((item, index) => (
          <a 
            key={index}
            href={`#${item.key}`}
            className="relative h-full pb-2 text-gray-700 font-semibold hover:text-green-700"
          >
            {item.label}
            {current === item.key ? (
              <motion.div
              layoutId="underline"
              className="h-[5px] w-full absolute bg-green-700 -bottom-[2.5px] rounded-2xl" />
            ) : null}
          </a>
        ))}
      </div>
    </div>
  );
};

export default Navigation;
