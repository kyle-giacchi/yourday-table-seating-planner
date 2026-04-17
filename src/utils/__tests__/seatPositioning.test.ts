import { describe, it, expect } from 'vitest';
import { calculateRoundTableSeats, calculateRectangleTableSeats } from '@/utils/seatPositioning';

const SEAT_RADIUS = 6;
const SPACING = 3;

describe('seatPositioning', () => {
  describe('calculateRoundTableSeats', () => {
    it('returns the requested number of seats', () => {
      expect(calculateRoundTableSeats(100, 100, 8)).toHaveLength(8);
      expect(calculateRoundTableSeats(100, 100, 1)).toHaveLength(1);
      expect(calculateRoundTableSeats(100, 100, 0)).toHaveLength(0);
    });

    it("places the first seat at 12 o'clock (top of table)", () => {
      const seats = calculateRoundTableSeats(100, 100, 4);
      const tableW = 100;
      const tableH = 100;
      const radius = tableW / 2;
      const outerRadius = radius + SEAT_RADIUS + SPACING;

      // First seat: angle = -π/2 → (cx, cy - outerRadius)
      expect(seats[0].x).toBeCloseTo(tableW / 2, 5);
      expect(seats[0].y).toBeCloseTo(tableH / 2 - outerRadius, 5);
    });

    it('distributes seats clockwise at equal angles', () => {
      const seats = calculateRoundTableSeats(100, 100, 4);
      // Seat 1 should be at 3 o'clock (right side)
      expect(seats[1].x).toBeGreaterThan(seats[0].x);
      // Seat 2 should be at 6 o'clock (bottom)
      expect(seats[2].y).toBeGreaterThan(seats[0].y);
      // Seat 3 should be at 9 o'clock (left side)
      expect(seats[3].x).toBeLessThan(seats[0].x);
    });

    it('assigns unique sequential ids', () => {
      const seats = calculateRoundTableSeats(100, 100, 3);
      expect(seats.map((s) => s.id)).toEqual(['seat-0', 'seat-1', 'seat-2']);
    });

    it('marks all seats as initially unoccupied', () => {
      const seats = calculateRoundTableSeats(100, 100, 8);
      expect(seats.every((s) => s.occupied === false)).toBe(true);
    });
  });

  describe('calculateRectangleTableSeats', () => {
    it('returns the requested number of seats', () => {
      expect(calculateRectangleTableSeats(120, 60, 6)).toHaveLength(6);
      expect(calculateRectangleTableSeats(120, 60, 8)).toHaveLength(8);
    });

    it('splits seats roughly equally between top and bottom rows', () => {
      const seats = calculateRectangleTableSeats(120, 60, 6);
      // Top row Y = -seatRadius - spacing (negative)
      // Bottom row Y = tableHeight + seatRadius + spacing
      const topY = -SEAT_RADIUS - SPACING;
      const bottomY = 60 + SEAT_RADIUS + SPACING;

      const topSeats = seats.filter((s) => s.y === topY);
      const bottomSeats = seats.filter((s) => s.y === bottomY);

      expect(topSeats).toHaveLength(3);
      expect(bottomSeats).toHaveLength(3);
    });

    it('places top seats above the table and bottom seats below it', () => {
      const seats = calculateRectangleTableSeats(120, 60, 6);
      const topSeats = seats.filter((s) => s.id.startsWith('seat-top'));
      const bottomSeats = seats.filter((s) => s.id.startsWith('seat-bottom'));

      expect(topSeats.every((s) => s.y < 0)).toBe(true);
      expect(bottomSeats.every((s) => s.y > 60)).toBe(true);
    });

    it('puts an extra seat on the top row when count is odd', () => {
      const seats = calculateRectangleTableSeats(120, 60, 7);
      const topSeats = seats.filter((s) => s.id.startsWith('seat-top'));
      const bottomSeats = seats.filter((s) => s.id.startsWith('seat-bottom'));
      // Math.ceil(7/2) = 4 top, Math.floor(7/2) = 3 bottom
      expect(topSeats).toHaveLength(4);
      expect(bottomSeats).toHaveLength(3);
    });

    it('seats are spaced evenly along the width', () => {
      const seats = calculateRectangleTableSeats(120, 60, 4);
      const topSeats = seats.filter((s) => s.id.startsWith('seat-top'));
      // 2 top seats, spacing = 120 / 3 = 40, so x = 40, 80
      expect(topSeats[0].x).toBeCloseTo(40, 5);
      expect(topSeats[1].x).toBeCloseTo(80, 5);
    });
  });
});
