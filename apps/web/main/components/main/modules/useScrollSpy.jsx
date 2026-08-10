'use client'
import { useEffect, useState, useRef } from 'react';

export function useScrollSpy(sectionIds = [], options = {}) {
  const [activeId, setActiveId] = useState('');
  const ticking = useRef(false);
  const sections = useRef([]);

  const offset = options.offset || 120; 
  // مقدار ثابت برای اینکه وقتی navbar داری سکشن کمی پایین‌تر فعال بشه

  // تابع برای محاسبه مجدد offsetTop همه سکشن‌ها
  const recalc = () => {
    sections.current = sectionIds
      .map(id => {
        const el = document.getElementById(id);
        if (!el) return null;
        return { id, top: el.offsetTop };
      })
      .filter(Boolean);
  };

  useEffect(() => {
    if (!sectionIds.length) return;

    recalc(); // بار اول محاسبه

    const onScroll = () => {
      if (!ticking.current) {
        requestAnimationFrame(() => {
          const scrollPos = window.scrollY + offset;

          let current = sections.current[0]?.id || '';

          for (let i = 0; i < sections.current.length; i++) {
            const sec = sections.current[i];
            if (scrollPos >= sec.top) {
              current = sec.id;
            }
          }

          if (current !== activeId) {
            setActiveId(current);
            history.replaceState(null, '', `#${current}`);
          }

          ticking.current = false;
        });

        ticking.current = true;
      }
    };

    window.addEventListener('scroll', onScroll);
    window.addEventListener('resize', recalc);

    let observer = new MutationObserver(() => {
      // هر تغییری در ارتفاع سکشن‌ها → offsetها دوباره محاسبه
      recalc();
      onScroll();
    });

    observer.observe(document.body, { childList: true, subtree: true, attributes: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', recalc);
      observer.disconnect();
    };
  }, [sectionIds.join('|'), offset, activeId]);

  return activeId;
}
