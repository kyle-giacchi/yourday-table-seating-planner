export interface ViewportState {
  /** Zoom multiplier, clamped to 0.25 – 4.0. */
  zoom: number;
  /** Horizontal pan offset in pre-zoom canvas pixels. */
  panX: number;
  /** Vertical pan offset in pre-zoom canvas pixels. */
  panY: number;
}

export interface CanvasPoint {
  x: number;
  y: number;
}
