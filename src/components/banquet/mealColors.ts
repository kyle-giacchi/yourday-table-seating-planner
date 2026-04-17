export const MEAL_COLOR_HEX: Record<string, string> = {
  Chicken: '#eab308',
  Beef: '#dc2626',
  Vegetarian: '#22c55e',
  Vegan: '#16a34a',
  Fish: '#3b82f6',
  Unassigned: '#ef4444',
};

const FALLBACK_HEX = '#6b7280';

export const mealHex = (mealType: string): string => MEAL_COLOR_HEX[mealType] ?? FALLBACK_HEX;

export const MEAL_BG_CLASS: Record<string, string> = {
  Chicken: 'bg-yellow-500',
  Beef: 'bg-red-600',
  Vegetarian: 'bg-green-500',
  Vegan: 'bg-green-600',
  Fish: 'bg-blue-500',
  Unassigned: 'bg-red-500',
};

export const mealBgClass = (mealType: string): string => MEAL_BG_CLASS[mealType] ?? 'bg-gray-500';
