// src/hooks/use-is-mobile.ts
import { useState, useEffect } from 'react'

const MOBILE_BREAKPOINT = 768

// Use a function to memoize the query instead of re-creating it on each render
const getMobileMediaQuery = () => `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }

    const mql = window.matchMedia(getMobileMediaQuery())
    mql.addEventListener('change', handleResize)
    handleResize()

    return () => mql.removeEventListener('change', handleResize)
  }, [MOBILE_BREAKPOINT])

  return !!isMobile
}