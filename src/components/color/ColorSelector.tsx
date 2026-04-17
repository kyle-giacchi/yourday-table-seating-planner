import { useEffect } from 'react';
import { useColorTheme, COLOR_THEMES, type ColorTheme } from '@/contexts/ColorThemeContext';
import { Check } from 'lucide-react';

interface ColorSelectorProps {
  /** Fires when the user starts/stops previewing a color, so the parent can pause auto-rotation. */
  onHoveringChange?: (hovering: boolean) => void;
}

export const ColorSelector = ({ onHoveringChange }: ColorSelectorProps) => {
  const { selectedTheme, setSelectedTheme, previewTheme } = useColorTheme();

  // Clear any lingering preview when the selector unmounts.
  useEffect(() => () => previewTheme(null), [previewTheme]);

  const handleEnter = (theme: ColorTheme) => {
    previewTheme(theme);
    onHoveringChange?.(true);
  };

  const handleLeave = () => {
    previewTheme(null);
    onHoveringChange?.(false);
  };

  const handleCommit = (theme: ColorTheme) => {
    // Revert DOM to committed state first so the wave animation
    // interpolates from the real committed color, not the preview color.
    previewTheme(null);
    setSelectedTheme(theme);
    onHoveringChange?.(false);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-foreground mb-4 text-xl font-semibold">Choose Your Color</h3>
      </div>

      <div
        className="mx-auto grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7"
        onMouseLeave={handleLeave}
      >
        {COLOR_THEMES.map((theme) => {
          const isSelected = selectedTheme.name === theme.name;

          return (
            <button
              key={theme.name}
              type="button"
              onMouseEnter={() => handleEnter(theme)}
              onFocus={() => handleEnter(theme)}
              onBlur={handleLeave}
              onClick={() => handleCommit(theme)}
              className={`group relative rounded-xl border-2 p-4 transition-all duration-300 hover:scale-105 ${
                isSelected
                  ? 'ring-primary border-muted-foreground shadow-lg ring-2 ring-offset-2'
                  : 'border-border hover:border-input hover:shadow-md'
              } `}
            >
              <div
                className="mx-auto mb-2 h-8 w-8 rounded-full shadow-md transition-all duration-300 group-hover:shadow-lg"
                style={{ backgroundColor: `hsl(${theme.value})` }}
              >
                {isSelected && (
                  <div className="flex h-full w-full items-center justify-center">
                    <Check className="text-primary-foreground h-4 w-4" />
                  </div>
                )}
              </div>

              <div className="text-center">
                <p className="text-foreground text-xs font-medium">{theme.name}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
