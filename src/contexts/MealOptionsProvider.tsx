import type { ReactNode } from 'react';
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { DEFAULT_MEAL_OPTIONS, defaultRepository } from '@/services/DataRepository';
import { MealOptionsContext, type MealOptionItem } from './MealOptionsContext';

const DEFAULT_VALUES = new Set(DEFAULT_MEAL_OPTIONS.map((o) => o.value));

const mergeWithDefaults = (saved: MealOptionItem[]): MealOptionItem[] => {
  const merged = [...DEFAULT_MEAL_OPTIONS];
  saved.forEach((item) => {
    if (!DEFAULT_VALUES.has(item.value)) merged.push(item);
  });
  return merged;
};

const loadInitialMealOptions = (): MealOptionItem[] => {
  const saved = defaultRepository.loadMealOptions();
  return saved ? mergeWithDefaults(saved) : DEFAULT_MEAL_OPTIONS;
};

const addIfMissing = (list: MealOptionItem[], value: string): MealOptionItem[] => {
  const exists = list.some((o) => o.value.toLowerCase() === value.toLowerCase());
  return exists ? list : [...list, { value, label: value }];
};

const useDebouncedSave = (mealOptions: MealOptionItem[]) => {
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      defaultRepository.saveMealOptions(mealOptions);
    }, 300);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [mealOptions]);
};

const useMealOptionMutations = (
  setMealOptions: React.Dispatch<React.SetStateAction<MealOptionItem[]>>,
) => {
  const addMealOption = useCallback(
    (mealType: string) => {
      const trimmed = mealType.trim();
      if (!trimmed) return;
      setMealOptions((prev) => addIfMissing(prev, trimmed));
    },
    [setMealOptions],
  );

  const addMealOptions = useCallback(
    (mealTypes: string[]) => {
      const valid = mealTypes.map((m) => m.trim()).filter((m) => m.length > 0);
      if (valid.length === 0) return;
      setMealOptions((prev) => valid.reduce(addIfMissing, prev));
    },
    [setMealOptions],
  );

  const removeMealOption = useCallback(
    (value: string) => {
      setMealOptions((prev) => prev.filter((o) => o.value !== value));
    },
    [setMealOptions],
  );

  const updateMealOption = useCallback(
    (oldValue: string, newValue: string) => {
      const trimmed = newValue.trim();
      if (!trimmed) return;
      setMealOptions((prev) => {
        const duplicate = prev.some(
          (o) => o.value !== oldValue && o.value.toLowerCase() === trimmed.toLowerCase(),
        );
        if (duplicate) return prev;
        return prev.map((o) => (o.value === oldValue ? { value: trimmed, label: trimmed } : o));
      });
    },
    [setMealOptions],
  );

  const resetToDefaults = useCallback(() => {
    setMealOptions(DEFAULT_MEAL_OPTIONS);
  }, [setMealOptions]);

  return { addMealOption, addMealOptions, removeMealOption, updateMealOption, resetToDefaults };
};

export const MealOptionsProvider = ({ children }: { children: ReactNode }) => {
  const [mealOptions, setMealOptions] = useState<MealOptionItem[]>(loadInitialMealOptions);

  useDebouncedSave(mealOptions);

  const mutations = useMealOptionMutations(setMealOptions);

  const contextValue = useMemo(() => ({ mealOptions, ...mutations }), [mealOptions, mutations]);

  return <MealOptionsContext.Provider value={contextValue}>{children}</MealOptionsContext.Provider>;
};
