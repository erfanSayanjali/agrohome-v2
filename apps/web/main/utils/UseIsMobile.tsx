import { useEffect, useState } from "react"

export function useIsMobile(breakpoint: number) {
  // مقدار اولیه بر اساس یک حدس امن (تا mismatch نزنه)
  // اگر بخوای برعکس باشه (پیش‌فرض موبایل)، بگو.
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false
    return window.innerWidth <= breakpoint
  })

  useEffect(() => {
    const media = window.matchMedia(`(max-width: ${breakpoint}px)`)

    const update = () => setIsMobile(media.matches)

    update()
    media.addEventListener("change", update)

    return () => media.removeEventListener("change", update)
  }, [breakpoint])

  return isMobile
}
