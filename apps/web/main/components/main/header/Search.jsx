'use client';

import { useState } from "react";
import { FaSearch } from "react-icons/fa";
import { useQueryManager } from "../../../utils/QueryManager";

const Search = ({isHome}) => {
    const [search, setSearch] = useState('');
    const query = useQueryManager(); 
    return (
        <div className={`${isHome ? 'glass-card' : 'bg-[#f9f9f9]! rounded-3xl relative'} h-full w-full flex *:text-white    items-center px-4 `}>
            <input
                className={`w-full ${!isHome  ? 'text-[#B7B7B7]!' :''} bg-transparent outline-none  text-sm`}
                placeholder="جستجو محصولات..."
                onChange={(e) => setSearch(e.target.value)}
                value={search}
                type="text"
                name="search"
                onKeyDown={(e)=>{
                    if(e.key === 'Enter'){
                        query.set({search , page:1},{targetUrl:'/products'});
                    }
                }}
                />

                <div 
                onClick={()=>{
                    query.set({search,page:1},{targetUrl:'/products'});
                }}
                className={`${isHome ? 'bg-white':'bg-[#DFDFDF]'} h-[41px] cursor-pointer flex items-center justify-center absolute left-0 w-[41px] rounded-full`}>
                    <FaSearch color="#000"/>
                </div>

        </div>
    );
};

export default Search;