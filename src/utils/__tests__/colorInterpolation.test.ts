import { describe, it, expect } from 'vitest';
import {
  parseHSL,
  parseRGB,
  formatHSL,
  formatRGB,
  lerpHue,
  lerp,
  easeInOutCubic,
} from '@/utils/colorInterpolation';

describe('colorInterpolation', () => {
  describe('parseHSL', () => {
    it('parses a standard HSL string', () => {
      expect(parseHSL('221 83% 41%')).toEqual([221, 83, 41]);
    });

    it('parses fractional values', () => {
      expect(parseHSL('220.5 50.25% 33.75%')).toEqual([220.5, 50.25, 33.75]);
    });

    it('returns null for malformed input', () => {
      expect(parseHSL('')).toBeNull();
      expect(parseHSL('not a color')).toBeNull();
      expect(parseHSL('221 83')).toBeNull();
    });
  });

  describe('parseRGB', () => {
    it('parses a comma-separated RGB triplet', () => {
      expect(parseRGB('30, 64, 175')).toEqual([30, 64, 175]);
    });

    it('tolerates extra whitespace', () => {
      expect(parseRGB('30,  64 ,  175')).toEqual([30, 64, 175]);
    });

    it('returns null for malformed input', () => {
      expect(parseRGB('30, 64')).toBeNull();
      expect(parseRGB('a, b, c')).toBeNull();
    });
  });

  describe('formatHSL / formatRGB', () => {
    it('rounds and formats HSL', () => {
      expect(formatHSL(220.6, 83.4, 41.5)).toBe('221 83% 42%');
    });

    it('rounds and formats RGB', () => {
      expect(formatRGB(30.4, 63.5, 175.6)).toBe('30, 64, 176');
    });
  });

  describe('lerpHue (the wraparound case is the bug-prone one)', () => {
    it('takes the short way going forward through 0° (350° → 10°)', () => {
      // Halfway between 350° and 10° via the short path is 0° (or 360°).
      const mid = lerpHue(350, 10, 0.5);
      expect(mid).toBeCloseTo(0, 5);
    });

    it('takes the short way going backward through 0° (10° → 350°)', () => {
      const mid = lerpHue(10, 350, 0.5);
      expect(mid).toBeCloseTo(0, 5);
    });

    it('does NOT race across the wheel for hue values straddling 0°', () => {
      // The buggy "linear" implementation would return 180 here.
      const mid = lerpHue(350, 10, 0.5);
      expect(mid).not.toBeCloseTo(180, 1);
    });

    it('returns the from-value at t=0', () => {
      expect(lerpHue(120, 240, 0)).toBeCloseTo(120, 5);
    });

    it('returns the to-value at t=1', () => {
      expect(lerpHue(120, 240, 1)).toBeCloseTo(240, 5);
    });

    it('takes the long way only when the short way is exactly 180°', () => {
      // 0° → 180° has equal-length arcs; either direction is acceptable.
      // We just verify the result is on one of the two valid endpoints at t=1.
      expect(lerpHue(0, 180, 1)).toBeCloseTo(180, 5);
    });

    it('handles a normal interpolation that does not cross the seam', () => {
      // 100° → 200° at t=0.5 → 150° (linear, no wraparound)
      expect(lerpHue(100, 200, 0.5)).toBeCloseTo(150, 5);
    });
  });

  describe('lerp', () => {
    it('returns endpoints at t=0 and t=1', () => {
      expect(lerp(10, 20, 0)).toBe(10);
      expect(lerp(10, 20, 1)).toBe(20);
    });

    it('returns midpoint at t=0.5', () => {
      expect(lerp(10, 20, 0.5)).toBe(15);
    });
  });

  describe('easeInOutCubic', () => {
    it('returns 0 at t=0 and 1 at t=1', () => {
      expect(easeInOutCubic(0)).toBe(0);
      expect(easeInOutCubic(1)).toBe(1);
    });

    it('returns 0.5 at t=0.5 (symmetry)', () => {
      expect(easeInOutCubic(0.5)).toBeCloseTo(0.5, 5);
    });

    it('starts slow (eases in)', () => {
      // At t=0.25, cubic ease should be < linear (0.25)
      expect(easeInOutCubic(0.25)).toBeLessThan(0.25);
    });

    it('ends slow (eases out)', () => {
      // At t=0.75, cubic ease should be > linear (0.75)
      expect(easeInOutCubic(0.75)).toBeGreaterThan(0.75);
    });
  });
});
