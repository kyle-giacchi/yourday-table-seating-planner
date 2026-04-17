/**
 * 20 visually distinct colors for guest position highlighting.
 * Each entry has a dot color (seat circle), plus light bg/border/text for guest tiles.
 */
export const POSITION_COLORS = [
  {
    dot: '#ef4444',
    ring: 'rgba(239,68,68,0.45)',
    bg: '#fef2f2',
    border: '#fecaca',
    text: '#991b1b',
  }, // red
  {
    dot: '#3b82f6',
    ring: 'rgba(59,130,246,0.45)',
    bg: '#eff6ff',
    border: '#bfdbfe',
    text: '#1e40af',
  }, // blue
  {
    dot: '#22c55e',
    ring: 'rgba(34,197,94,0.45)',
    bg: '#f0fdf4',
    border: '#bbf7d0',
    text: '#166534',
  }, // green
  {
    dot: '#f97316',
    ring: 'rgba(249,115,22,0.45)',
    bg: '#fff7ed',
    border: '#fed7aa',
    text: '#9a3412',
  }, // orange
  {
    dot: '#a855f7',
    ring: 'rgba(168,85,247,0.45)',
    bg: '#faf5ff',
    border: '#e9d5ff',
    text: '#6b21a8',
  }, // purple
  {
    dot: '#14b8a6',
    ring: 'rgba(20,184,166,0.45)',
    bg: '#f0fdfa',
    border: '#99f6e4',
    text: '#115e59',
  }, // teal
  {
    dot: '#ec4899',
    ring: 'rgba(236,72,153,0.45)',
    bg: '#fdf2f8',
    border: '#fbcfe8',
    text: '#9d174d',
  }, // pink
  {
    dot: '#eab308',
    ring: 'rgba(234,179,8,0.45)',
    bg: '#fefce8',
    border: '#fef08a',
    text: '#854d0e',
  }, // yellow
  {
    dot: '#6366f1',
    ring: 'rgba(99,102,241,0.45)',
    bg: '#eef2ff',
    border: '#c7d2fe',
    text: '#3730a3',
  }, // indigo
  {
    dot: '#06b6d4',
    ring: 'rgba(6,182,212,0.45)',
    bg: '#ecfeff',
    border: '#a5f3fc',
    text: '#155e75',
  }, // cyan
  {
    dot: '#84cc16',
    ring: 'rgba(132,204,22,0.45)',
    bg: '#f7fee7',
    border: '#d9f99d',
    text: '#3f6212',
  }, // lime
  {
    dot: '#f43f5e',
    ring: 'rgba(244,63,94,0.45)',
    bg: '#fff1f2',
    border: '#fecdd3',
    text: '#9f1239',
  }, // rose
  {
    dot: '#d97706',
    ring: 'rgba(217,119,6,0.45)',
    bg: '#fffbeb',
    border: '#fde68a',
    text: '#92400e',
  }, // amber
  {
    dot: '#8b5cf6',
    ring: 'rgba(139,92,246,0.45)',
    bg: '#f5f3ff',
    border: '#ddd6fe',
    text: '#5b21b6',
  }, // violet
  {
    dot: '#10b981',
    ring: 'rgba(16,185,129,0.45)',
    bg: '#ecfdf5',
    border: '#a7f3d0',
    text: '#065f46',
  }, // emerald
  {
    dot: '#d946ef',
    ring: 'rgba(217,70,239,0.45)',
    bg: '#fdf4ff',
    border: '#f5d0fe',
    text: '#86198f',
  }, // fuchsia
  {
    dot: '#0ea5e9',
    ring: 'rgba(14,165,233,0.45)',
    bg: '#f0f9ff',
    border: '#bae6fd',
    text: '#0c4a6e',
  }, // sky
  {
    dot: '#64748b',
    ring: 'rgba(100,116,139,0.45)',
    bg: '#f8fafc',
    border: '#cbd5e1',
    text: '#334155',
  }, // slate
  {
    dot: '#fb7185',
    ring: 'rgba(251,113,133,0.45)',
    bg: '#fff1f2',
    border: '#fda4af',
    text: '#881337',
  }, // coral
  {
    dot: '#2dd4bf',
    ring: 'rgba(45,212,191,0.45)',
    bg: '#f0fdfa',
    border: '#5eead4',
    text: '#134e4a',
  }, // mint
] as const;

/** Get a position color by index (wraps around for 20+). */
export const getPositionColor = (index: number) => POSITION_COLORS[index % POSITION_COLORS.length];
