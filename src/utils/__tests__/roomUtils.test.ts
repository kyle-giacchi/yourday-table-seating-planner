import { describe, it, expect } from 'vitest';
import {
  calculateReferenceScale,
  calculatePixelDimensions,
  calculateRealWorldDimensions,
  migrateToPercentageCoordinates,
} from '@/utils/roomUtils';
import type { RoomRectangle } from '@/types/room';

const makeRect = (overrides: Partial<RoomRectangle> = {}): RoomRectangle => ({
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  realWorldWidth: 0,
  realWorldHeight: 0,
  isVisible: true,
  ...overrides,
});

describe('roomUtils', () => {
  describe('calculateReferenceScale', () => {
    it('returns 1 when realWorldWidth is 0', () => {
      const ref = makeRect({ realWorldWidth: 0, width: 50, height: 50 });
      expect(calculateReferenceScale(ref, { width: 1000, height: 1000 })).toBe(1);
    });

    it('computes pixels-per-inch from rectangle width alone (width-only data)', () => {
      // A 10-foot wide rectangle at 50% of a 1000px-wide canvas = 500px.
      // 500px / 10ft = 50 px/ft, /12 ≈ 4.17 px/inch
      const ref = makeRect({
        width: 50,
        height: 0,
        realWorldWidth: 10,
      });
      const scale = calculateReferenceScale(ref, { width: 1000, height: 1000 });
      expect(scale).toBeCloseTo(50 / 12, 5);
    });

    it('averages width- and height-derived scales when both dimensions are set', () => {
      // 40% × 60% rect on a 1000×1000 canvas = 400 × 600 px representing 10 × 15 ft.
      // From width: 400 / 10 = 40 ppf. From height: 600 / 15 = 40 ppf. Avg = 40 ppf → 40/12 px/in
      const ref = makeRect({
        width: 40,
        height: 60,
        realWorldWidth: 10,
        realWorldHeight: 15,
      });
      const scale = calculateReferenceScale(ref, { width: 1000, height: 1000 });
      expect(scale).toBeCloseTo(40 / 12, 5);
    });

    it('renders a 20×20 ft square rectangle at the expected scale', () => {
      // 50% × 50% on a 1000×1000 canvas = 500×500 px representing 20×20 ft.
      // 500/20 = 25 px/ft, /12 ≈ 2.083 px/inch. A 240-in dance floor should render
      // at ≈500 px — matching the rectangle the user drew. (Diagonal bug used to
      // return 500*sqrt(2)/20/12 ≈ 2.946, inflating the dance floor by √2.)
      const ref = makeRect({
        width: 50,
        height: 50,
        realWorldWidth: 20,
        realWorldHeight: 20,
      });
      const scale = calculateReferenceScale(ref, { width: 1000, height: 1000 });
      expect(scale).toBeCloseTo(25 / 12, 5);
      expect(240 * scale).toBeCloseTo(500, 5);
    });

    it('returns 1 when the rectangle has no extent', () => {
      const ref = makeRect({ width: 0, height: 0, realWorldWidth: 10 });
      expect(calculateReferenceScale(ref, { width: 1000, height: 1000 })).toBe(1);
    });
  });

  describe('calculatePixelDimensions', () => {
    it('multiplies real-world dimensions by scale', () => {
      expect(calculatePixelDimensions(60, 30, 5)).toEqual({ width: 300, height: 150 });
    });
  });

  describe('calculateRealWorldDimensions', () => {
    it('divides pixel dimensions by scale', () => {
      const result = calculateRealWorldDimensions(300, 150, 5);
      expect(result.realWorldWidth).toBeCloseTo(60, 2);
      expect(result.realWorldHeight).toBeCloseTo(30, 2);
    });

    it('roundtrips through calculatePixelDimensions', () => {
      const px = calculatePixelDimensions(72, 30, 4.17);
      const rw = calculateRealWorldDimensions(px.width, px.height, 4.17);
      expect(rw.realWorldWidth).toBeCloseTo(72, 1);
      expect(rw.realWorldHeight).toBeCloseTo(30, 1);
    });
  });

  describe('migrateToPercentageCoordinates', () => {
    it('passes through coordinates already in 0-100 range', () => {
      const ref = makeRect({ x: 25, y: 50, width: 30, height: 40 });
      expect(migrateToPercentageCoordinates(ref, { width: 1000, height: 1000 })).toBe(ref);
    });

    it('converts absolute pixel coordinates to percentages', () => {
      const ref = makeRect({ x: 200, y: 300, width: 500, height: 250 });
      const result = migrateToPercentageCoordinates(ref, { width: 1000, height: 1000 });
      expect(result.x).toBe(20);
      expect(result.y).toBe(30);
      expect(result.width).toBe(50);
      expect(result.height).toBe(25);
    });

    it('does not migrate borderline data where all fields happen to be ≤100', () => {
      // This documents the heuristic: we treat ≤100 as "already percentage".
      // Real-world pixel coords above 100 trigger the migration; small ones don't.
      const ref = makeRect({ x: 90, y: 90, width: 90, height: 90 });
      expect(migrateToPercentageCoordinates(ref, { width: 1000, height: 1000 })).toBe(ref);
    });
  });
});
