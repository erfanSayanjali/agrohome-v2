'use client'

import { useEffect, useState } from "react";

function ContentList() {
    const [toc, setToc] = useState([]);

    useEffect(() => {
    const container = document.querySelector(".editor");
    if (!container) return;

    const headings = container.querySelectorAll("h1, h2, h3, h4, h5, h6");

    headings.forEach((h, i) => {
        if (!h.id) {
            h.id = h.textContent.trim().replace(/\s+/g, "-") + "-" + i;
        }
    });
    
        const items = Array.from(headings).map((h) => ({
        id: h.id,
        text: h.textContent,
        level: Number(h.tagName.replace("H", "")),
    }));
setToc(items);

}, []);

  return (
  <div className="toc bg-[#F3F3F3]  rounded-2xl p-4">
    <p className="mb-3 font-extrabold">فهرست مطالب</p>
    <ul className="list-disc px-5">
        {toc.map(item => (
        <li 
            key={item.id}
            style={{ marginLeft: (item.level - 1) * 16 }}
            onClick={() => {
                document.getElementById(item.id)?.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }}
            className="cursor-pointer hover:text-green-900"
        >
            {item.text}
        </li>
    ))}
    </ul>
</div>

  )
}

export default ContentList
