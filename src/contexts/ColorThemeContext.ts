import { createContext, useContext } from 'react';
import type { ColorTheme } from '@/types/appData';

export type { ColorTheme } from '@/types/appData';

export const COLOR_THEMES: ColorTheme[] = [
  {
    name: 'Deep Blue',
    value: '221 83% 41%',
    rgb: '30, 64, 175',
    secondary: '221 83% 65%',
    secondaryRgb: '118, 169, 250',
    description: 'Classic and professional',
  },
  {
    name: 'Emerald',
    value: '160 84% 39%',
    rgb: '16, 185, 129',
    secondary: '160 84% 60%',
    secondaryRgb: '52, 211, 153',
    description: 'Fresh and vibrant',
  },
  {
    name: 'Coral',
    value: '340 82% 52%',
    rgb: '244, 63, 94',
    secondary: '340 82% 75%',
    secondaryRgb: '251, 113, 133',
    description: 'Elegant and romantic',
  },
  {
    name: 'Royal Purple',
    value: '258 90% 66%',
    rgb: '147, 51, 234',
    secondary: '258 90% 80%',
    secondaryRgb: '196, 181, 253',
    description: 'Luxurious and bold',
  },
  {
    name: 'Burgundy',
    value: '0 59% 41%',
    rgb: '153, 27, 27',
    secondary: '0 59% 65%',
    secondaryRgb: '220, 38, 38',
    description: 'Rich and sophisticated',
  },
  {
    name: 'Amber',
    value: '38 92% 50%',
    rgb: '245, 158, 11',
    secondary: '38 92% 70%',
    secondaryRgb: '251, 191, 36',
    description: 'Warm and radiant',
  },
  {
    name: 'Teal',
    value: '183 74% 35%',
    rgb: '20, 184, 166',
    secondary: '183 74% 55%',
    secondaryRgb: '45, 212, 191',
    description: 'Modern and serene',
  },
];

export interface ColorThemeContextType {
  selectedTheme: ColorTheme;
  setSelectedTheme: (theme: ColorTheme) => void;
  /**
   * Apply a theme to the DOM instantly without committing it to state,
   * animating, saving, or triggering the color wave. Pass `null` to
   * revert the DOM to the committed `selectedTheme`.
   */
  previewTheme: (theme: ColorTheme | null) => void;
  isAnimating: boolean;
}

export const ColorThemeContext = createContext<ColorThemeContextType | undefined>(undefined);

export const useColorTheme = () => {
  const context = useContext(ColorThemeContext);
  if (context === undefined) {
    throw new Error('useColorTheme must be used within a ColorThemeProvider');
  }
  return context;
};
