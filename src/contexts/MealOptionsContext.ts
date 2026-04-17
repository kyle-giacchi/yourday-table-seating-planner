import { createContext, useContext } from 'react';
import type { MealOptionItem } from '@/services/DataRepository';

export type { MealOptionItem } from '@/services/DataRepository';

export interface MealOptionsContextType {
  mealOptions: MealOptionItem[];
  addMealOption: (mealType: string) => void;
  addMealOptions: (mealTypes: string[]) => void;
  removeMealOption: (value: string) => void;
  updateMealOption: (oldValue: string, newValue: string) => void;
  resetToDefaults: () => void;
}

export const MealOptionsContext = createContext<MealOptionsContextType | undefined>(undefined);

export const useMealOptions = () => {
  const context = useContext(MealOptionsContext);
  if (context === undefined) {
    throw new Error('useMealOptions must be used within a MealOptionsProvider');
  }
  return context;
};
