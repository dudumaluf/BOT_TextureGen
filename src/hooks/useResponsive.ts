import { useState, useEffect } from 'react';

export function useResponsive() {
  const [isMobile, setIsMobile] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize on client side only
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
      setIsInitialized(true);
    };

    // Initial check
    checkMobile();

    // Debounced resize handler to prevent excessive re-renders
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(checkMobile, 150); // 150ms debounce
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  // Return false during SSR/initial render to prevent hydration mismatch
  return { isMobile: isInitialized ? isMobile : false, isInitialized };
}
