import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Random offset in [-range/2, +range/2]. Used to scatter newly-added canvas
 * items around a point so they don't stack perfectly when added in sequence.
 */
export const positionJitter = (range = 80): number => (Math.random() - 0.5) * range;
