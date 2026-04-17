import { useState, useCallback, useMemo } from 'react';
import { clamp } from '@/lib/utils';

export interface ZoomState {
  level: number;
  centerX: number;
  centerY: number;
}

export interface ZoomControls {
  canZoomIn: boolean;
  canZoomOut: boolean;
  isDefaultZoom: boolean;
}

type ActiveTab = 'image' | 'room';

const ZOOM_LIMITS = {
  MIN: 0.8,
  MAX: 4.0,
  FACTOR: 1.25,
} as const;

export const useCanvasControls = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('image');
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 800, height: 600 });

  // Calculate default zoom state based on current canvas dimensions
  const getDefaultZoomState = useCallback(
    (): ZoomState => ({
      level: 1.0,
      centerX: canvasDimensions.width / 2,
      centerY: canvasDimensions.height / 2,
    }),
    [canvasDimensions],
  );

  const [zoomState, setZoomState] = useState<ZoomState>(getDefaultZoomState());

  const updateCanvasDimensions = useCallback(
    (width: number, height: number) => {
      setCanvasDimensions({ width, height });

      // Always auto-center when canvas dimensions change (new image upload)
      const defaultState = getDefaultZoomState();
      setZoomState((prev) => ({
        ...prev,
        centerX: defaultState.centerX,
        centerY: defaultState.centerY,
      }));
    },
    [getDefaultZoomState],
  );

  const setZoom = useCallback(
    (level: number, centerX?: number, centerY?: number) => {
      const clampedLevel = clamp(level, ZOOM_LIMITS.MIN, ZOOM_LIMITS.MAX);
      const defaultCenter = getDefaultZoomState();

      setZoomState({
        level: clampedLevel,
        centerX: centerX ?? defaultCenter.centerX,
        centerY: centerY ?? defaultCenter.centerY,
      });
    },
    [getDefaultZoomState],
  );

  const zoomIn = useCallback(() => {
    setZoom(zoomState.level * ZOOM_LIMITS.FACTOR, zoomState.centerX, zoomState.centerY);
  }, [zoomState, setZoom]);

  const zoomOut = useCallback(() => {
    setZoom(zoomState.level / ZOOM_LIMITS.FACTOR, zoomState.centerX, zoomState.centerY);
  }, [zoomState, setZoom]);

  const resetZoom = useCallback(() => {
    const defaultState = getDefaultZoomState();
    setZoom(defaultState.level, defaultState.centerX, defaultState.centerY);
  }, [setZoom, getDefaultZoomState]);

  // New method to auto-center the view
  const centerView = useCallback(() => {
    const defaultState = getDefaultZoomState();
    setZoomState((prev) => ({
      ...prev,
      centerX: defaultState.centerX,
      centerY: defaultState.centerY,
    }));
  }, [getDefaultZoomState]);

  const zoomControls: ZoomControls = useMemo(
    () => ({
      canZoomIn: zoomState.level < ZOOM_LIMITS.MAX,
      canZoomOut: zoomState.level > ZOOM_LIMITS.MIN,
      isDefaultZoom: zoomState.level === 1.0,
    }),
    [zoomState.level],
  );

  return {
    activeTab,
    setActiveTab,
    zoomState,
    zoomControls,
    canvasDimensions,
    updateCanvasDimensions,
    setZoom,
    zoomIn,
    zoomOut,
    resetZoom,
    centerView,
  };
};
