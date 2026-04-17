import type { RefObject } from 'react';
import { useLayoutEffect, useRef } from 'react';

interface UseColumnHeightSyncProps {
  sourceRef: RefObject<HTMLElement | null>;
  targetRef: RefObject<HTMLElement | null>;
}

export const useColumnHeightSync = ({ sourceRef, targetRef }: UseColumnHeightSyncProps): null => {
  const resizeObserverRef = useRef<ResizeObserver>(undefined);

  useLayoutEffect(() => {
    if (!sourceRef.current || !targetRef.current) return;

    const syncHeight = () => {
      if (sourceRef.current && targetRef.current) {
        const sourceHeight = sourceRef.current.offsetHeight;
        targetRef.current.style.height = `${sourceHeight}px`;
      }
    };

    // Initial sync
    syncHeight();

    // Set up ResizeObserver for continuous monitoring
    resizeObserverRef.current = new ResizeObserver(() => {
      requestAnimationFrame(syncHeight);
    });

    resizeObserverRef.current.observe(sourceRef.current);

    // Also listen to window resize as fallback
    window.addEventListener('resize', syncHeight);

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      window.removeEventListener('resize', syncHeight);
    };
  }, [sourceRef, targetRef]);

  return null;
};
