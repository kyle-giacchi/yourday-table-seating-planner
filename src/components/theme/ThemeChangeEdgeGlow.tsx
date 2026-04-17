import { useColorTheme } from '@/contexts/ColorThemeContext';

export const ThemeChangeEdgeGlow = () => {
  const { isAnimating, selectedTheme } = useColorTheme();
  if (!isAnimating) return null;
  const rgb = selectedTheme.rgb;
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[100] overflow-hidden motion-reduce:hidden"
    >
      <div
        key={selectedTheme.name}
        className="animate-color-wave absolute inset-y-0 left-0 w-[70vw]"
        style={{
          background: `linear-gradient(to right, transparent 0%, rgba(${rgb}, 0.18) 35%, rgba(${rgb}, 0.32) 55%, rgba(${rgb}, 0.18) 75%, transparent 100%)`,
          filter: 'blur(24px)',
        }}
      />
    </div>
  );
};
