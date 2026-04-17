import { describe, it, expect } from 'vitest';
import { checkCapacityStatus, CapacityStatus } from '@/lib/capacityChecker';

// Helper to build a minimal table stub accepted by checkCapacityStatus
const makeTable = (guestCount: number, defaultChairs: number, maxChairs: number) => ({
  guests: Array.from({ length: guestCount }, (_, i) => ({ id: String(i + 1) })),
  defaultChairs,
  maxChairs,
});

describe('checkCapacityStatus', () => {
  // -------------------------------------------------------------------
  // WITHIN_DEFAULT
  // -------------------------------------------------------------------

  describe('WITHIN_DEFAULT', () => {
    it('returns WITHIN_DEFAULT when adding to an empty table within default capacity', () => {
      const table = makeTable(0, 8, 10);
      const result = checkCapacityStatus(table, 4);
      expect(result.status).toBe(CapacityStatus.WITHIN_DEFAULT);
    });

    it('returns WITHIN_DEFAULT when adding a single guest to a partially filled table', () => {
      const table = makeTable(3, 8, 10);
      const result = checkCapacityStatus(table, 1);
      expect(result.status).toBe(CapacityStatus.WITHIN_DEFAULT);
    });

    it('returns WITHIN_DEFAULT when new total equals exactly the default capacity', () => {
      const table = makeTable(6, 8, 10);
      const result = checkCapacityStatus(table, 2); // 6 + 2 = 8 === defaultChairs
      expect(result.status).toBe(CapacityStatus.WITHIN_DEFAULT);
    });

    it('reports correct counts', () => {
      const table = makeTable(2, 8, 10);
      const result = checkCapacityStatus(table, 3);
      expect(result.currentCount).toBe(2);
      expect(result.newCount).toBe(5);
      expect(result.defaultCapacity).toBe(8);
      expect(result.maxCapacity).toBe(10);
      expect(result.assignmentSize).toBe(3);
    });
  });

  // -------------------------------------------------------------------
  // EXCEEDS_DEFAULT
  // -------------------------------------------------------------------

  describe('EXCEEDS_DEFAULT', () => {
    it('returns EXCEEDS_DEFAULT when new count exceeds default but is within max', () => {
      const table = makeTable(8, 8, 10);
      const result = checkCapacityStatus(table, 1); // 9 > 8, 9 <= 10
      expect(result.status).toBe(CapacityStatus.EXCEEDS_DEFAULT);
    });

    it('returns EXCEEDS_DEFAULT when new count equals exactly the max capacity', () => {
      const table = makeTable(8, 8, 10);
      const result = checkCapacityStatus(table, 2); // 10 === maxChairs
      expect(result.status).toBe(CapacityStatus.EXCEEDS_DEFAULT);
    });

    it('returns EXCEEDS_DEFAULT when starting below default but assignment pushes past it', () => {
      const table = makeTable(5, 8, 12);
      const result = checkCapacityStatus(table, 5); // 10 > 8, 10 <= 12
      expect(result.status).toBe(CapacityStatus.EXCEEDS_DEFAULT);
    });
  });

  // -------------------------------------------------------------------
  // EXCEEDS_MAXIMUM
  // -------------------------------------------------------------------

  describe('EXCEEDS_MAXIMUM', () => {
    it('returns EXCEEDS_MAXIMUM when new count exceeds max capacity', () => {
      const table = makeTable(10, 8, 10);
      const result = checkCapacityStatus(table, 1); // 11 > 10
      expect(result.status).toBe(CapacityStatus.EXCEEDS_MAXIMUM);
    });

    it('returns EXCEEDS_MAXIMUM even when table is empty but assignment is too large', () => {
      const table = makeTable(0, 8, 10);
      const result = checkCapacityStatus(table, 11);
      expect(result.status).toBe(CapacityStatus.EXCEEDS_MAXIMUM);
    });

    it('reports correct counts when exceeding max', () => {
      const table = makeTable(9, 8, 10);
      const result = checkCapacityStatus(table, 3);
      expect(result.currentCount).toBe(9);
      expect(result.newCount).toBe(12);
      expect(result.status).toBe(CapacityStatus.EXCEEDS_MAXIMUM);
    });
  });

  // -------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------

  describe('edge cases', () => {
    it('handles an empty table with assignment size of 0', () => {
      const table = makeTable(0, 8, 10);
      const result = checkCapacityStatus(table, 0);
      expect(result.status).toBe(CapacityStatus.WITHIN_DEFAULT);
      expect(result.newCount).toBe(0);
    });

    it('works when defaultChairs equals maxChairs', () => {
      // If default === max, any value over default is immediately EXCEEDS_MAXIMUM
      const table = makeTable(5, 8, 8);
      const result = checkCapacityStatus(table, 4); // 9 > 8 = max
      expect(result.status).toBe(CapacityStatus.EXCEEDS_MAXIMUM);
    });
  });
});
