# Theme & Color System

**Scope:** The color theme picker, the smooth color-transition pipeline, and the edge-glow effect that fires whenever the theme changes. Read this before touching `ColorThemeProvider`, `ColorSelector`, `ThemeChangeEdgeGlow`, or the homepage auto-rotate loop.

## Pieces in play

```
src/contexts/ColorThemeContext.ts       # COLOR_THEMES catalog (7 presets), context shape
src/contexts/ColorThemeProvider.tsx     # Smooth HSL interpolation, isAnimating flag, repository persistence
src/components/color/ColorSelector.tsx  # 7-color chip grid; hover preview + click commit
src/components/theme/ThemeChangeEdgeGlow.tsx  # Root-mounted edge glow rendered while isAnimating
src/pages/Index.tsx                     # Homepage 10s auto-rotate loop, paused on hover
src/index.css                           # CSS custom props + keyframes (edge-glow, color-morph, glow-pulse)
```

## The 7 presets

`COLOR_THEMES` in `ColorThemeContext.ts` defines 7 themes (Deep Blue, Emerald, Coral, Royal Purple, Burgundy, Amber, Teal). Each theme carries:

- `value` — primary HSL string
- `rgb` — primary as `r, g, b` (used for `--primary-rgb` so CSS can build `rgba(var(--primary-rgb), 0.5)` style overlays)
- `secondary` variants and descriptions

The active theme flows out via `useColorTheme()` and the provider exposes both `selectedTheme` and `setSelectedTheme(theme)`.

## The transition pipeline

`ColorThemeProvider.tsx` is the heart of the system:

1. On `setSelectedTheme(theme)`:
   - Validate the color via the security layer (sanitize HSL/RGB strings — this is one of the few places sanitization is mandatory before writing CSS variables).
   - Set `isAnimating = true` immediately. Consumers (the edge glow, the homepage title) react to this flag.
2. **800 ms HSL interpolation** with ease-in-out-cubic easing. The provider walks hue (shortest arc — important for crossing the wraparound at 0/360°), saturation, and lightness in lockstep and writes intermediate HSL values to the root CSS custom props on every animation frame:
   - `--primary`
   - `--primary-rgb`
   - `--secondary-custom`
   - `--secondary-custom-rgb`
3. After 800 ms, `isAnimating = false`.
4. Persistence is debounced (300 ms) so a quick flick through several themes doesn't hammer the repository — only the theme the user lands on gets saved.

`ColorThemeProvider` is also the only consumer of the **transition timing constants**. If you need to change the duration, change it here — both the edge glow and any consumer that animates off `isAnimating` will pick up the new value as long as they read it from CSS or the provider rather than hardcoding their own number.

## ColorSelector — hover preview vs commit

`src/components/color/ColorSelector.tsx` renders the 7-chip grid. The behavior is deliberately different for hover and click:

- **Hover** → `setSelectedTheme(themeUnderCursor)` runs immediately, with the 800 ms interpolation. The user sees the new color blooming across the page.
- **Mouse leave** → reverts to the previously committed theme (also via interpolation, so it's a smooth roundtrip).
- **Click** → commits the current chip permanently. Subsequent hovers no longer revert to anything older.

A 120 ms hover debounce filters out quick mouse flyovers — moving the cursor across the row of chips fast doesn't trigger 7 transitions. The selected chip carries a check mark.

The selector also emits an `onHoveringChange(boolean)` callback so parents (specifically `Index.tsx`) can pause auto-rotation while the user is interacting. This is the only way the homepage's auto-rotate loop knows to back off.

## ThemeChangeEdgeGlow

`src/components/theme/ThemeChangeEdgeGlow.tsx` is mounted at the App root in `App.tsx` (it sits next to `<Toaster />` in `AppLayout`). It only renders DOM while `isAnimating === true`, so it's effectively free in the steady state.

When it does render:

- Two gradient overlays (left edge + right edge) using `rgba(var(--primary-rgb), …)` so the color tracks the live interpolation in real time.
- A 700 ms `cubic-bezier` keyframe (defined in `src/index.css`) animates `opacity 0 → 1 → 0` and `scaleX 0.6 → 1 → 1`.
- Wrapped in `motion-reduce:hidden` (or equivalent) so users with `prefers-reduced-motion` don't see the flash.

## Homepage auto-rotation

`src/pages/Index.tsx` runs a 10 second interval that walks `themeIndexRef` through `COLOR_THEMES` and calls `setSelectedTheme` on each tick. The interval is paused while `hoverPaused === true`:

```
ColorSelector.onHoveringChange(true)
   → Index.setHoverPaused(true)
       → useEffect dep changes → interval cleared
   ← user moves mouse off chips
ColorSelector.onHoveringChange(false)
   → Index.setHoverPaused(false)
       → useEffect re-arms interval
```

So the user can hover a chip, see what it looks like, and the page won't yank them to the next color two seconds later.

The homepage title also gets `animate-glow-pulse` and `animate-color-morph` classes during the transition window — these are decorative and rely on the same `--primary-rgb` custom prop.

## CSS — keyframes & custom props

`src/index.css` is the single source for the animation primitives:

| Keyframe                | Used by               | Behavior                                      |
| ----------------------- | --------------------- | --------------------------------------------- |
| `edge-glow` (~700 ms)   | `ThemeChangeEdgeGlow` | opacity / scaleX bloom                        |
| `color-morph` (~800 ms) | Homepage title        | brightness 1 → 1.15 → 1, opacity 1 → 0.92 → 1 |
| `glow-pulse` (~800 ms)  | Homepage title        | text-shadow bloom + scale 1 → 1.02 → 1        |

CSS custom props on `:root`:

- `--primary`, `--primary-rgb` — driven by the provider during interpolation
- `--secondary-custom`, `--secondary-custom-rgb` — same
- Dark mode overrides hue/lightness via the existing `dark` class hook but keeps the same variable names

## Gotchas

- **`isAnimating` is short-lived.** If you write a consumer that needs to know "did the theme just change?" use the flag while it's true. Don't poll for it; subscribe via the context.
- **HSL interpolation is hue-aware.** When changing a theme, hue takes the shortest arc — going from hue 350° to hue 10° should pass through 0°, not through 180°. This is what makes the transition feel like a color shift instead of a slideshow. If you fork the provider, do not lose this.
- **Don't hardcode colors in components that should track the theme.** Use `var(--primary)` / `rgba(var(--primary-rgb), …)` so the hover preview and edge glow both reach you "for free."
- **Auto-rotate must respect `onHoveringChange`.** Adding a new consumer of `setSelectedTheme` without thinking about pause coordination will fight the user — they hover one color, the timer fires, the page jumps. The Index loop only knows to pause because `ColorSelector` tells it.
- **`ThemeChangeEdgeGlow` mounts at the App root, not the page.** If you ever wrap App in a route-specific layout, keep the glow at the root — it should fire on any page, not just the homepage.
