import type { ReactNode } from 'react';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { validateColorTheme, validateHSLValue, validateRGBValue } from '@/lib/security';
import { defaultRepository } from '@/services/DataRepository';
import {
  parseHSL,
  parseRGB,
  formatHSL,
  formatRGB,
  lerpHue,
  lerp,
  easeInOutCubic,
} from '@/utils/colorInterpolation';
import { ColorThemeContext, COLOR_THEMES, type ColorTheme } from './ColorThemeContext';

const loadInitialTheme = (): ColorTheme => {
  const parsed = defaultRepository.loadTheme();
  if (!parsed) return COLOR_THEMES[0];
  const matched = COLOR_THEMES.find((t) => t.name === parsed.name);
  if (matched) return matched;
  // Custom themes (or any saved theme not in the preset list) survive reload
  // as long as they pass the same security validation used by the setter.
  if (validateColorTheme(parsed)) return parsed;
  return COLOR_THEMES[0];
};

let activeTransition: number | null = null;

const TRANSITION_DURATION_MS = 800;
const WAVE_DURATION_MS = 2000;

const applyThemeToRoot = (theme: ColorTheme, animate = true) => {
  const root = document.documentElement;

  // Read current values from the root for smooth interpolation
  const currentPrimary = root.style.getPropertyValue('--primary').trim();
  const currentRgb = root.style.getPropertyValue('--primary-rgb').trim();
  const currentSecondary = root.style.getPropertyValue('--secondary-custom').trim();
  const currentSecRgb = root.style.getPropertyValue('--secondary-custom-rgb').trim();

  const fromHSL = parseHSL(currentPrimary);
  const toHSL = validateHSLValue(theme.value) ? parseHSL(theme.value) : null;
  const fromRGB = parseRGB(currentRgb);
  const toRGB = validateRGBValue(theme.rgb) ? parseRGB(theme.rgb) : null;
  const fromSecHSL = parseHSL(currentSecondary);
  const toSecHSL = validateHSLValue(theme.secondary) ? parseHSL(theme.secondary) : null;
  const fromSecRGB = parseRGB(currentSecRgb);
  const toSecRGB = validateRGBValue(theme.secondaryRgb) ? parseRGB(theme.secondaryRgb) : null;

  // If we can't interpolate (first load or invalid values), apply instantly
  if (!animate || !fromHSL || !toHSL) {
    if (validateHSLValue(theme.value)) root.style.setProperty('--primary', theme.value);
    if (validateRGBValue(theme.rgb)) root.style.setProperty('--primary-rgb', theme.rgb);
    if (validateHSLValue(theme.secondary))
      root.style.setProperty('--secondary-custom', theme.secondary);
    if (validateRGBValue(theme.secondaryRgb))
      root.style.setProperty('--secondary-custom-rgb', theme.secondaryRgb);
    return;
  }

  // Cancel any in-flight transition
  if (activeTransition !== null) cancelAnimationFrame(activeTransition);

  const start = performance.now();

  const tick = (now: number) => {
    const elapsed = now - start;
    const rawT = Math.min(elapsed / TRANSITION_DURATION_MS, 1);
    const t = easeInOutCubic(rawT);

    root.style.setProperty(
      '--primary',
      formatHSL(
        lerpHue(fromHSL[0], toHSL[0], t),
        lerp(fromHSL[1], toHSL[1], t),
        lerp(fromHSL[2], toHSL[2], t),
      ),
    );

    if (fromRGB && toRGB) {
      root.style.setProperty(
        '--primary-rgb',
        formatRGB(
          lerp(fromRGB[0], toRGB[0], t),
          lerp(fromRGB[1], toRGB[1], t),
          lerp(fromRGB[2], toRGB[2], t),
        ),
      );
    }

    if (fromSecHSL && toSecHSL) {
      root.style.setProperty(
        '--secondary-custom',
        formatHSL(
          lerpHue(fromSecHSL[0], toSecHSL[0], t),
          lerp(fromSecHSL[1], toSecHSL[1], t),
          lerp(fromSecHSL[2], toSecHSL[2], t),
        ),
      );
    }

    if (fromSecRGB && toSecRGB) {
      root.style.setProperty(
        '--secondary-custom-rgb',
        formatRGB(
          lerp(fromSecRGB[0], toSecRGB[0], t),
          lerp(fromSecRGB[1], toSecRGB[1], t),
          lerp(fromSecRGB[2], toSecRGB[2], t),
        ),
      );
    }

    if (rawT < 1) {
      activeTransition = requestAnimationFrame(tick);
    } else {
      activeTransition = null;
    }
  };

  activeTransition = requestAnimationFrame(tick);
};

const useThemeSetter = (
  setSelectedTheme: React.Dispatch<React.SetStateAction<ColorTheme>>,
  setIsAnimating: (v: boolean) => void,
) => {
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    },
    [],
  );

  return useCallback(
    (theme: ColorTheme) => {
      if (!validateColorTheme(theme)) return;
      setSelectedTheme((prev) => {
        if (theme.name === prev.name && theme.value === prev.value) return prev;
        // Only trigger the wave on an actual theme swap. Same-name updates
        // (e.g. live custom-color slider drags) should feel instantaneous.
        if (theme.name !== prev.name) {
          setIsAnimating(true);
          setTimeout(() => setIsAnimating(false), WAVE_DURATION_MS);
        }
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
          defaultRepository.saveTheme(theme);
        }, 300);
        return theme;
      });
    },
    [setSelectedTheme, setIsAnimating],
  );
};

interface ColorThemeProviderProps {
  children: ReactNode;
}

export const ColorThemeProvider = ({ children }: ColorThemeProviderProps) => {
  const [selectedTheme, setSelectedTheme] = useState<ColorTheme>(loadInitialTheme);
  const [isAnimating, setIsAnimating] = useState(false);
  const isInitialMount = useRef(true);
  const isAnimatingRef = useRef(false);
  const prevThemeRef = useRef<ColorTheme>(selectedTheme);

  useEffect(() => {
    isAnimatingRef.current = isAnimating;
  }, [isAnimating]);

  const handleSetSelectedTheme = useThemeSetter(setSelectedTheme, setIsAnimating);

  useEffect(() => {
    const prev = prevThemeRef.current;
    // Only interpolate on theme swaps. Same-name tweaks (custom color sliders)
    // apply instantly so dragging doesn't queue an 800ms chase per tick.
    const shouldAnimate = !isInitialMount.current && prev.name !== selectedTheme.name;
    isInitialMount.current = false;
    applyThemeToRoot(selectedTheme, shouldAnimate);
    prevThemeRef.current = selectedTheme;
  }, [selectedTheme]);

  const previewTheme = useCallback(
    (theme: ColorTheme | null) => {
      // Ignore previews while a committed wave is in flight so the DOM
      // vars don't jump around mid-interpolation.
      if (isAnimatingRef.current) return;
      if (theme === null) {
        applyThemeToRoot(selectedTheme, false);
        return;
      }
      if (!validateColorTheme(theme)) return;
      applyThemeToRoot(theme, false);
    },
    [selectedTheme],
  );

  const contextValue = useMemo(
    () => ({
      selectedTheme,
      setSelectedTheme: handleSetSelectedTheme,
      previewTheme,
      isAnimating,
    }),
    [selectedTheme, handleSetSelectedTheme, previewTheme, isAnimating],
  );

  return <ColorThemeContext.Provider value={contextValue}>{children}</ColorThemeContext.Provider>;
};
