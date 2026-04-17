import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { COLOR_THEMES, type ColorTheme } from '@/contexts/ColorThemeContext';

const CUSTOM_THEME_NAME = 'Custom';

// Safe HSL ranges that keep `text-white` on `bg-primary` readable and prevent
// washed-out badges/hovers. Anything outside these bounds risks failing AA
// contrast or producing a primary color indistinguishable from neutrals.
const HUE_MIN = 0;
const HUE_MAX = 360;
const SAT_MIN = 40;
const SAT_MAX = 90;
const LIGHT_MIN = 25;
const LIGHT_MAX = 55;

const DEFAULT_CUSTOM_HSL: [number, number, number] = [220, 70, 45];

const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
  const sNorm = s / 100;
  const lNorm = l / 100;
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;
  let rgb: [number, number, number];
  if (h < 60) rgb = [c, x, 0];
  else if (h < 120) rgb = [x, c, 0];
  else if (h < 180) rgb = [0, c, x];
  else if (h < 240) rgb = [0, x, c];
  else if (h < 300) rgb = [x, 0, c];
  else rgb = [c, 0, x];
  return [
    Math.round((rgb[0] + m) * 255),
    Math.round((rgb[1] + m) * 255),
    Math.round((rgb[2] + m) * 255),
  ];
};

const buildCustomTheme = (h: number, s: number, l: number): ColorTheme => {
  const hi = Math.round(h);
  const si = Math.round(s);
  const li = Math.round(l);
  const [r, g, b] = hslToRgb(hi, si, li);
  const secL = Math.min(85, li + 25);
  const secS = Math.max(40, si - 10);
  const [sr, sg, sb] = hslToRgb(hi, secS, secL);
  return {
    name: CUSTOM_THEME_NAME,
    value: `${hi} ${si}% ${li}%`,
    rgb: `${r}, ${g}, ${b}`,
    secondary: `${hi} ${secS}% ${secL}%`,
    secondaryRgb: `${sr}, ${sg}, ${sb}`,
    description: 'Your custom color',
  };
};

const parseThemeHSL = (theme: ColorTheme): [number, number, number] => {
  const parts = theme.value.match(/([\d.]+)/g);
  if (!parts || parts.length < 3) return DEFAULT_CUSTOM_HSL;
  return [parseFloat(parts[0]), parseFloat(parts[1]), parseFloat(parts[2])];
};

interface ThemeColorPickerProps {
  selectedTheme: ColorTheme;
  setSelectedTheme: (theme: ColorTheme) => void;
}

export const ThemeColorPicker = ({ selectedTheme, setSelectedTheme }: ThemeColorPickerProps) => {
  const isCustomActive = selectedTheme.name === CUSTOM_THEME_NAME;
  const [showCustom, setShowCustom] = useState(isCustomActive);

  const [hue, sat, light] = useMemo(() => {
    if (!isCustomActive) return DEFAULT_CUSTOM_HSL;
    return parseThemeHSL(selectedTheme);
    // Re-seed sliders whenever the active theme name changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only reseed on theme switches
  }, [selectedTheme.name]);

  const [hueState, setHue] = useState(hue);
  const [satState, setSat] = useState(sat);
  const [lightState, setLight] = useState(light);

  const commit = (h: number, s: number, l: number) => {
    setSelectedTheme(buildCustomTheme(h, s, l));
  };

  return (
    <div className="px-2 py-1.5">
      <div className="grid grid-cols-4 gap-2">
        {COLOR_THEMES.map((theme) => (
          <button
            key={theme.name}
            type="button"
            onClick={() => {
              setShowCustom(false);
              setSelectedTheme(theme);
            }}
            className={cn(
              'h-8 w-8 rounded-full border-2 transition-all duration-150 hover:scale-110',
              selectedTheme.name === theme.name
                ? 'border-foreground ring-input ring-2'
                : 'hover:border-input border-transparent',
            )}
            style={{ backgroundColor: `hsl(${theme.value})` }}
            title={theme.name}
          />
        ))}
        <button
          type="button"
          onClick={() => setShowCustom((v) => !v)}
          className={cn(
            'h-8 w-8 rounded-full border-2 transition-all duration-150 hover:scale-110',
            isCustomActive
              ? 'border-foreground ring-input ring-2'
              : 'hover:border-input border-transparent',
          )}
          style={{
            background: isCustomActive
              ? `hsl(${selectedTheme.value})`
              : 'conic-gradient(from 0deg, #ef4444, #f59e0b, #84cc16, #10b981, #06b6d4, #3b82f6, #8b5cf6, #ec4899, #ef4444)',
          }}
          title="Custom color"
        />
      </div>

      {showCustom && (
        <div className="border-border/60 mt-3 space-y-2.5 border-t pt-2.5">
          <div>
            <div className="text-muted-foreground flex items-center justify-between text-[10px] font-medium">
              <span>Hue</span>
              <span>{Math.round(hueState)}°</span>
            </div>
            <input
              type="range"
              min={HUE_MIN}
              max={HUE_MAX}
              value={hueState}
              onChange={(e) => {
                const h = Number(e.target.value);
                setHue(h);
                commit(h, satState, lightState);
              }}
              className="h-2 w-full cursor-pointer appearance-none rounded-full"
              style={{
                background:
                  'linear-gradient(to right, hsl(0,70%,45%), hsl(60,70%,45%), hsl(120,70%,45%), hsl(180,70%,45%), hsl(240,70%,45%), hsl(300,70%,45%), hsl(360,70%,45%))',
              }}
            />
          </div>
          <div>
            <div className="text-muted-foreground flex items-center justify-between text-[10px] font-medium">
              <span>Saturation</span>
              <span>{Math.round(satState)}%</span>
            </div>
            <input
              type="range"
              min={SAT_MIN}
              max={SAT_MAX}
              value={satState}
              onChange={(e) => {
                const s = Number(e.target.value);
                setSat(s);
                commit(hueState, s, lightState);
              }}
              className="h-2 w-full cursor-pointer appearance-none rounded-full"
              style={{
                background: `linear-gradient(to right, hsl(${hueState}, ${SAT_MIN}%, ${lightState}%), hsl(${hueState}, ${SAT_MAX}%, ${lightState}%))`,
              }}
            />
          </div>
          <div>
            <div className="text-muted-foreground flex items-center justify-between text-[10px] font-medium">
              <span>Brightness</span>
              <span>{Math.round(lightState)}%</span>
            </div>
            <input
              type="range"
              min={LIGHT_MIN}
              max={LIGHT_MAX}
              value={lightState}
              onChange={(e) => {
                const l = Number(e.target.value);
                setLight(l);
                commit(hueState, satState, l);
              }}
              className="h-2 w-full cursor-pointer appearance-none rounded-full"
              style={{
                background: `linear-gradient(to right, hsl(${hueState}, ${satState}%, ${LIGHT_MIN}%), hsl(${hueState}, ${satState}%, ${LIGHT_MAX}%))`,
              }}
            />
          </div>
          <p className="text-muted-foreground/80 text-[10px] leading-tight">
            Ranges kept in a safe zone so UI elements stay readable.
          </p>
        </div>
      )}
    </div>
  );
};
