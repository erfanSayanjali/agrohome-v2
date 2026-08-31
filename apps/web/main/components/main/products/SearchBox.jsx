'use client';
import { useEffect, useState } from "react";
import { IoClose } from "react-icons/io5";


const SearchBox = ({query,search=''  ,placeholder}) => {
    const [searchTerm, setSearchTerm] = useState('');
    useEffect(()=>{
        setSearchTerm(search)
    },[search])

    const submitSearch = () => {
        query.set({ search: searchTerm || undefined, page: 1 });
    };

    const clearSearch = () => {
        setSearchTerm('');
        if (search) query.set({ search: undefined, page: 1 });
    };

    return (
        <div className=' hidden md:flex bg-[#F4F4F4]  items-center gap-2  justify-between  rounded-lg px-3 py-2.5 '>
            <input
            onKeyDown={(e)=>{
                if(e.key === 'Enter'){
                    submitSearch();
                }
            }}
            placeholder={placeholder ||"جستجو در محصولات..."}
                className="w-full outline-none placeholder:text-gray-400"
                onChange={(e) => setSearchTerm(e.target.value)}
                type="text" value={searchTerm || ''} />
            {searchTerm ? (
                <button
                    type="button"
                    onClick={clearSearch}
                    aria-label="حذف جستجو"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#707070] transition-colors hover:bg-white hover:text-red-600"
                >
                    <IoClose size={16} />
                </button>
            ) : null}
            <button
                type="button"
                onClick={submitSearch}
                aria-label="جستجو"
                className="flex h-7 w-7 shrink-0 items-center justify-center"
            >
                <svg
                    width="22" height="22" viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M23.5733 23.5732C23.4091 23.7375 23.201 23.8141 22.993 23.8141C22.785 23.8141 22.5769 23.7375 22.4127 23.5732L17.6279 18.7885C18.0549 18.4382 18.4382 18.0549 18.7885 17.6279L23.5733 22.4127C23.8908 22.7302 23.8908 23.2557 23.5733 23.5732Z" fill="#707070" />
                    <path opacity="0.4" d="M12.0439 20.8026C16.8815 20.8026 20.8031 16.881 20.8031 12.0434C20.8031 7.20582 16.8815 3.28418 12.0439 3.28418C7.20631 3.28418 3.28467 7.20582 3.28467 12.0434C3.28467 16.881 7.20631 20.8026 12.0439 20.8026Z" fill="#707070" />
                </svg>
            </button>
        </div>
    );
};

export default SearchBox;