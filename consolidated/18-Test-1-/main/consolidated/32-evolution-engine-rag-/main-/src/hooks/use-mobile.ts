// src/hooks/use-mobile.ts
import * as React from 'react';

const MOBILE_BREAKPOINT = 768;

/**
 * Hook to determine if the current screen width is considered mobile.
 *
 * @returns {boolean} Whether the screen width is less than the mobile breakpoint.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    const mediaQuery = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;
    const mediaQueryList = window.matchMedia(mediaQuery);
    const handleMediaQueryChange = () => {
      setIsMobile(mediaQueryList.matches);
    };

    mediaQueryList.addEventListener('change', handleMediaQueryChange);
    setIsMobile(mediaQueryList.matches);

    return () => {
      mediaQueryList.removeEventListener('change', handleMediaQueryChange);
    };
  }, [MOBILE_BREAKPOINT]);

  return !!isMobile;
}