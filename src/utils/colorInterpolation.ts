/**
 * Pure helpers used by ColorThemeProvider's animated theme transitions.
 *
 * Extracted from the provider so they can be unit-tested without rendering
 * a React tree or touching the DOM.
 */

/** Parse an HSL string like "221 83% 41%" into [h, s, l] numbers. */
export const parseHSL = (hsl: string): [number, number, number] | null => {
  const parts = hsl.match(/([\d.]+)/g);
  if (!parts || parts.length < 3) return null;
  return [parseFloat(parts[0]), parseFloat(parts[1]), parseFloat(parts[2])];
};

/** Parse an RGB string like "30, 64, 175" into [r, g, b] numbers. */
export const parseRGB = (rgb: string): [number, number, number] | null => {
  const parts = rgb.split(',').map((s) => parseFloat(s.trim()));
  if (parts.length < 3 || parts.some(isNaN)) return null;
  return [parts[0], parts[1], parts[2]];
};

export const formatHSL = (h: number, s: number, l: number): string =>
  `${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%`;

export const formatRGB = (r: number, g: number, b: number): string =>
  `${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}`;

/**
 * Interpolate the shortest arc between two hue values on a 0-360 wheel.
 *
 * Going from 350° → 10° travels through 0° (20° distance), not through 180°
 * (340° distance). Without this wraparound logic the animation would dramatically
 * race across the entire color wheel for hue values near the seam.
 */
export const lerpHue = (from: number, to: number, t: number): number => {
  let diff = to - from;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return (((from + diff * t) % 360) + 360) % 360;
};

/** Linear interpolation between two scalars. */
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Easing function — ease-in-out cubic for a smooth, relaxing feel. */
export const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
