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

    // Set initial value
    setViewportHeight();

    // Debounced resize handler
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(setViewportHeight, 150);
    };

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
      clearTimeout(timeoutId);
    };
  }, []);
}
