import type { RefObject } from 'react';
import { useEffect, useCallback, useRef } from 'react';

interface UseCanvasDimensionsObserverProps {
  canvasRef: RefObject<HTMLDivElement | null>;
  onDimensionsChange: (width: number, height: number) => void;
}

export const useCanvasDimensionsObserver = ({
  canvasRef,
  onDimensionsChange,
}: UseCanvasDimensionsObserverProps) => {
  const lastDimensionsRef = useRef({ width: 0, height: 0 });
  const debounceTimeoutRef = useRef<NodeJS.Timeout>(undefined);

  // Latest-ref pattern: keep the current callback accessible from stable handlers
  // below without re-creating them. This avoids the stale-closure bug of
  // useCallback(onDimensionsChange, []) while letting the effect below depend
  // honestly on its inputs.
  const callbackRef = useRef(onDimensionsChange);
  useEffect(() => {
    callbackRef.current = onDimensionsChange;
  });

  const debouncedUpdate = useCallback((width: number, height: number) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      const lastDimensions = lastDimensionsRef.current;

      if (
        Math.abs(width - lastDimensions.width) > 1 ||
        Math.abs(height - lastDimensions.height) > 1
      ) {
        lastDimensionsRef.current = { width, height };
        callbackRef.current(width, height);
      }
    }, 16); // ~60fps debouncing
  }, []);

  const measureAndUpdate = useCallback(() => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      debouncedUpdate(rect.width, rect.height);
    }
  }, [canvasRef, debouncedUpdate]);

  useEffect(() => {
    // Initial measurement with delay to ensure DOM is ready
    const timer = setTimeout(measureAndUpdate, 100);

    if (!canvasRef.current) return () => clearTimeout(timer);

    const element = canvasRef.current;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        debouncedUpdate(width, height);
      }
    });

    resizeObserver.observe(element);

    window.addEventListener('resize', measureAndUpdate);

    return () => {
      clearTimeout(timer);
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      resizeObserver.disconnect();
      window.removeEventListener('resize', measureAndUpdate);
    };
  }, [canvasRef, debouncedUpdate, measureAndUpdate]);

  return { measureAndUpdate };
};
