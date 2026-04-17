/**
 * Generate a reasonably-unique ID with a stable prefix.
 *
 * The random suffix is `Math.random().toString(36).substring(2, 11)` — 9 chars of
 * base36 entropy, paired with `Date.now()` so collisions within a single ms are
 * astronomically unlikely. This is NOT cryptographic; it's fine for in-memory
 * client-side entity keys (tables, guests, assets) where the domain is small
 * and the IDs never leave the browser.
 */
export const generateId = (prefix: string): string =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
