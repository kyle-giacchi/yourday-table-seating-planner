export interface RoomRectangle {
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  width: number; // percentage (0-100)
  height: number; // percentage (0-100)
  realWorldWidth: number;
  realWorldHeight: number;
  isVisible: boolean;
}

export type RoomOutlineState = RoomRectangle;

export const ROOM_CONFIG = {
  MIN_SIZE: 5, // minimum 5% of canvas
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,
  PRECISION: 10, // for rounding real-world dimensions
} as const;
