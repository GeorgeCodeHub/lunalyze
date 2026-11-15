import { useEffect, useRef, useState } from 'react';

/**
 * The size of an element's box in CSS pixels, kept up to date as it changes. Until it is measured, and
 * where the browser cannot measure (tests), it is `fallback`. A size of zero (not laid out yet) is ignored.
 */
export const useBoxSize = <T extends Element>(fallback: { w: number; h: number }) => {
  const ref = useRef<T>(null);
  const [size, setSize] = useState(fallback);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setSize({ w: width, h: height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, size] as const;
};
