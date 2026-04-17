import type { RoomRectangle } from '@/types/room';
import { ROOM_CONFIG } from '@/types/room';

export const calculateReferenceScale = (
  referenceState: RoomRectangle,
  canvasDimensions: { width: number; height: number },
): number => {
  // The ScaleRectangle encodes a real-world area: `width`/`height` (%) are the
  // visual extent of a rectangle whose real-world footprint is
  // `realWorldWidth` × `realWorldHeight` feet. Each edge independently encodes
  // pixels-per-foot; StepSetScale constrains the visual aspect ratio to match
  // the real-world aspect so both values should agree. Average them when both
  // are present and fall back to whichever edge is valid otherwise.
  const hasWidth = referenceState.realWorldWidth > 0 && referenceState.width > 0;
  const hasHeight = referenceState.realWorldHeight > 0 && referenceState.height > 0;

  if (!hasWidth && !hasHeight) return 1;

  const ppfFromWidth = hasWidth
    ? ((referenceState.width / 100) * canvasDimensions.width) / referenceState.realWorldWidth
    : 0;
  const ppfFromHeight = hasHeight
    ? ((referenceState.height / 100) * canvasDimensions.height) / referenceState.realWorldHeight
    : 0;

  const pixelsPerFoot =
    hasWidth && hasHeight ? (ppfFromWidth + ppfFromHeight) / 2 : ppfFromWidth || ppfFromHeight;

  if (pixelsPerFoot <= 0) return 1;
  return pixelsPerFoot / 12;
};

export const calculatePixelDimensions = (
  realWorldWidth: number,
  realWorldHeight: number,
  scale: number,
): { width: number; height: number } => ({
  width: realWorldWidth * scale,
  height: realWorldHeight * scale,
});

export const calculateRealWorldDimensions = (
  pixelWidth: number,
  pixelHeight: number,
  scale: number,
): { realWorldWidth: number; realWorldHeight: number } => ({
  realWorldWidth: Math.round((pixelWidth / scale) * ROOM_CONFIG.PRECISION) / ROOM_CONFIG.PRECISION,
  realWorldHeight:
    Math.round((pixelHeight / scale) * ROOM_CONFIG.PRECISION) / ROOM_CONFIG.PRECISION,
});

// Migration utility to convert old absolute coordinates to percentage
export const migrateToPercentageCoordinates = (
  roomState: RoomRectangle,
  canvasDimensions: { width: number; height: number },
): RoomRectangle => {
  // Check if coordinates are already in percentage format (0-100 range)
  const isAlreadyPercentage =
    roomState.x <= 100 && roomState.y <= 100 && roomState.width <= 100 && roomState.height <= 100;

  if (isAlreadyPercentage) {
    return roomState;
  }

  // Convert absolute pixels to percentages
  return {
    ...roomState,
    x: (roomState.x / canvasDimensions.width) * 100,
    y: (roomState.y / canvasDimensions.height) * 100,
    width: (roomState.width / canvasDimensions.width) * 100,
    height: (roomState.height / canvasDimensions.height) * 100,
  };
};
