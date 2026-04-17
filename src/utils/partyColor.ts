const PALETTE = [
  'hsl(350 80% 55%)', // rose
  'hsl(40 90% 50%)', // amber
  'hsl(150 65% 40%)', // emerald
  'hsl(205 85% 50%)', // sky
  'hsl(270 70% 60%)', // violet
  'hsl(25 90% 55%)', // orange
  'hsl(180 65% 40%)', // teal
  'hsl(305 70% 55%)', // fuchsia
  'hsl(85 55% 45%)', // lime
  'hsl(240 70% 62%)', // indigo
];

const hash = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

/**
 * Deterministic party-name → color. Same input always yields same output.
 * Falls back to theme primary when no party name is provided.
 */
export const getPartyColor = (partyName: string | undefined | null): string => {
  if (!partyName) return 'hsl(var(--primary))';
  return PALETTE[hash(partyName) % PALETTE.length];
};
