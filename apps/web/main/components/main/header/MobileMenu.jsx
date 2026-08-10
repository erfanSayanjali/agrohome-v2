'use client';

import { useState } from "react";
import Portal from "../modules/Portal";
import { useIsMobile } from "../../../utils/UseIsMobile";
import { FaClosedCaptioning } from "react-icons/fa";
import { CgClose, CgCloseO, CgCloseR } from "react-icons/cg";
import NavBar from "./NavBar";
const menuSvg = <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path opacity="0.4" d="M15.417 3.3335H12.917C12.0837 3.3335 11.667 3.75016 11.667 4.5835V7.0835C11.667 7.91683 12.0837 8.3335 12.917 8.3335H15.417C16.2503 8.3335 16.667 7.91683 16.667 7.0835V4.5835C16.667 3.75016 16.2503 3.3335 15.417 3.3335Z" fill="white" />
    <path opacity="0.4" d="M7.08301 3.3335H4.58301C3.74967 3.3335 3.33301 3.75016 3.33301 4.5835V7.0835C3.33301 7.91683 3.74967 8.3335 4.58301 8.3335H7.08301C7.91634 8.3335 8.33301 7.91683 8.33301 7.0835V4.5835C8.33301 3.75016 7.91634 3.3335 7.08301 3.3335Z" fill="white" />
    <path d="M15.417 11.667H12.917C12.0837 11.667 11.667 12.0837 11.667 12.917V15.417C11.667 16.2503 12.0837 16.667 12.917 16.667H15.417C16.2503 16.667 16.667 16.2503 16.667 15.417V12.917C16.667 12.0837 16.2503 11.667 15.417 11.667Z" fill="white" />
    <path opacity="0.4" d="M7.08301 11.667H4.58301C3.74967 11.667 3.33301 12.0837 3.33301 12.917V15.417C3.33301 16.2503 3.74967 16.667 4.58301 16.667H7.08301C7.91634 16.667 8.33301 16.2503 8.33301 15.417V12.917C8.33301 12.0837 7.91634 11.667 7.08301 11.667Z" fill="white" />
</svg>
const MobileMenu = () => {
  const isMobile = useIsMobile(768);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className='bg-[#308060] p-1 rounded-lg w-[34px] h-[34px] md:hidden flex items-center justify-center'
      >
      {menuSvg}
      </button>

      {isOpen && (
        <Portal>
          <div className="absolute right-0 inset-0 z-[9999]">
            {/* backdrop */}
            <div
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/40 opacity-100 transition-opacity duration-300"
            />

            {/* panel */}
            <div
              className="
                absolute right-0 top-0 h-full w-[50%] bg-white 
                shadow-xl 
                animate-slideIn
              "
            >
              

              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-3 left-3 p-2 rounded-md bg-red-100 text-black"
              >
                <CgClose className="text-red-700"/>
              </button>
              {/* content */}
              <div className="p-3 mt-10">
                <NavBar wrapperClassName={'flex! mt-5'} className={'flex-col! flex! *:text-black! items-start  gap-7!'}/>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
};



export default MobileMenu;
