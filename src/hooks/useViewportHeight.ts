import { useEffect } from 'react';

export function useViewportHeight() {
  useEffect(() => {
    // Function to set the viewport height
    const setViewportHeight = () => {
      // Get the actual viewport height
      const vh = window.innerHeight * 0.01;
      // Set the CSS custom property
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    // Prevent scroll behavior on mobile
    const preventScroll = (e: TouchEvent) => {
      // Allow scrolling within specific scrollable containers
      const target = e.target as Element;
      const scrollableContainer = target.closest('.overflow-y-auto, .overflow-y-scroll, [data-scrollable="true"]');
      
      if (!scrollableContainer) {
        e.preventDefault();
      }
    };

    const preventScrollWheel = (e: WheelEvent) => {
      // Prevent wheel scrolling on the document
      if (e.target === document.body || e.target === document.documentElement) {
        e.preventDefault();
      }
    };

    // Set initial value
    setViewportHeight();

    // Debounced resize handler
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(setViewportHeight, 150);
    };

    // Add scroll prevention for mobile
    if (window.innerWidth < 640) {
      document.addEventListener('touchmove', preventScroll, { passive: false });
      document.addEventListener('wheel', preventScrollWheel, { passive: false });
    }

    // Listen for resize events
    window.addEventListener('resize', handleResize);
    
    // Listen for orientation changes (mobile)
    window.addEventListener('orientationchange', () => {
      // Delay to allow browser UI to settle
      setTimeout(setViewportHeight, 300);
    });

    // Listen for visual viewport changes (modern browsers)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', setViewportHeight);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', setViewportHeight);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', setViewportHeight);
      }
      document.removeEventListener('touchmove', preventScroll);
      document.removeEventListener('wheel', preventScrollWheel);
      clearTimeout(timeoutId);
    };
  }, []);
}
