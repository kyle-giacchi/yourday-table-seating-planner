import { useCallback, useRef } from 'react';

// Throttle utility using requestAnimationFrame for smooth performance
export const useRAFThrottle = <T extends (...args: unknown[]) => unknown>(callback: T): T => {
  const rafRef = useRef<number>(undefined);

  const throttled = useCallback(
    (...args: Parameters<T>) => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        callback(...args);
      });
    },
    [callback],
  );
  return throttled as T;
};

// Cache utility for DOM elements
export const useCachedElement = (selector: string) => {
  const elementRef = useRef<HTMLElement | null>(null);

  return useCallback(() => {
    if (!elementRef.current) {
      elementRef.current = document.querySelector(selector) as HTMLElement;
    }
    return elementRef.current;
  }, [selector]);
};
