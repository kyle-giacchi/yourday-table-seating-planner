# Styling Guide

## Rules

1. **Always use Tailwind utility classes** -- avoid inline styles except for dynamic values (positions, computed dimensions)
2. **Use CSS custom properties** (`hsl(var(--primary))`) -- never hardcode colors like `text-gray-500`; use semantic tokens (`text-muted-foreground`)
3. **Use shadcn/ui component variants** -- don't create custom button/badge/card styling when a variant exists
4. **Transitions**: Add `transition-colors duration-200` for color changes, `transition-all duration-200` when shadow/scale also changes
5. **Focus states**: Use `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2` or the `focus-enhanced` utility
6. **Dark mode**: Defined via `.dark` class; use `@custom-variant dark` in CSS. All semantic tokens auto-adapt.

## Color Tokens

All colors are HSL values defined as CSS custom properties in `src/index.css`:

### Core Colors

| Token                    | Tailwind Class               | Light Mode                   | Purpose                      |
| ------------------------ | ---------------------------- | ---------------------------- | ---------------------------- |
| `--background`           | `bg-background`              | White                        | Page background              |
| `--foreground`           | `text-foreground`            | Near-black                   | Primary text                 |
| `--primary`              | `bg-primary`, `text-primary` | Deep blue `221 83% 41%`      | Brand primary (dynamic)      |
| `--primary-foreground`   | `text-primary-foreground`    | Off-white                    | Text on primary              |
| `--secondary`            | `bg-secondary`               | Warm gray-blue `215 25% 27%` | Secondary actions            |
| `--secondary-foreground` | `text-secondary-foreground`  | Off-white                    | Text on secondary            |
| `--accent`               | `bg-accent`                  | Cyan `199 89% 48%`           | Interactive highlights       |
| `--accent-foreground`    | `text-accent-foreground`     | White                        | Text on accent               |
| `--muted`                | `bg-muted`                   | Light gray                   | Muted backgrounds            |
| `--muted-foreground`     | `text-muted-foreground`      | Medium gray                  | Secondary/caption text       |
| `--destructive`          | `bg-destructive`             | Red                          | Danger/delete actions        |
| `--card`                 | `bg-card`                    | White                        | Card backgrounds             |
| `--popover`              | `bg-popover`                 | White                        | Dropdown/popover backgrounds |
| `--border`               | `border-border`              | Light gray                   | Default borders              |
| `--ring`                 | `ring-ring`                  | Deep blue                    | Focus rings                  |

### Status Colors

| Token           | Tailwind Class   | Value               | Purpose             |
| --------------- | ---------------- | ------------------- | ------------------- |
| `--success`     | `bg-success`     | Green `165 93% 30%` | Success states      |
| `--warning`     | `bg-warning`     | Orange `32 95% 44%` | Warning states      |
| `--destructive` | `bg-destructive` | Red `0 84.2% 60.2%` | Error/danger states |

### Dynamic Theme Colors

Set at runtime by `ColorThemeContext` via `document.documentElement.style.setProperty()`:

| Token                         | Purpose                                       |
| ----------------------------- | --------------------------------------------- |
| `--primary-custom`            | Theme-selected primary color                  |
| `--primary-custom-foreground` | Text on theme primary                         |
| `--primary-rgb`               | RGB triplet for rgba() usage (shadows, glows) |
| `--secondary-custom`          | Theme-selected secondary color                |

**Available Themes** (defined in `src/contexts/ColorThemeContext.tsx`):

| Theme               | Primary HSL   |
| ------------------- | ------------- |
| Deep Blue (default) | `221 83% 41%` |
| Emerald             | `160 84% 39%` |
| Coral               | `340 82% 52%` |
| Royal Purple        | `258 90% 66%` |
| Burgundy            | `0 59% 41%`   |
| Amber               | `38 92% 50%`  |
| Teal                | `183 74% 35%` |

## Typography

### Font Family

- **Display**: `font-playfair` (Playfair Display, self-hosted WOFF2 from `/fonts/`)
- **Body**: System font stack (Tailwind default)

### Typography Scale

| Class                | Expansion                                     | Usage                    |
| -------------------- | --------------------------------------------- | ------------------------ |
| `text-display`       | `text-4xl font-bold tracking-tight`           | Page headings            |
| `text-section-title` | `text-2xl font-semibold tracking-tight`       | Section headings         |
| `text-card-title`    | `text-lg font-semibold`                       | Card headers             |
| `text-body`          | `text-base`                                   | Body text                |
| `text-caption`       | `text-sm text-muted-foreground`               | Captions, secondary text |
| `text-label`         | `text-xs font-medium uppercase tracking-wide` | Labels, tags             |

## Shadows

| Token             | Usage                                       |
| ----------------- | ------------------------------------------- |
| `shadow-soft`     | Subtle elevation for cards at rest          |
| `shadow-elevated` | Higher elevation for modals, popovers       |
| `shadow-glass`    | Glassmorphic effect with inner highlight    |
| `shadow-glow`     | Primary-colored glow (uses `--primary-rgb`) |

## Gradients

| Token                   | Usage                                                       |
| ----------------------- | ----------------------------------------------------------- |
| `--gradient-primary`    | Primary button backgrounds (135deg, darker at bottom-right) |
| `--gradient-secondary`  | Secondary button backgrounds                                |
| `--gradient-background` | Page body background (vertical, white to off-white)         |
| `--gradient-card`       | Card backgrounds (subtle, white to near-white)              |

## Spacing

| Utility           | Expansion   | Usage                |
| ----------------- | ----------- | -------------------- |
| `section-spacing` | `py-8 px-6` | Page sections        |
| `card-spacing`    | `p-6`       | Inside cards         |
| `compact-spacing` | `p-4`       | Compact card content |

Also available as CSS variables: `--spacing-section: 2rem`, `--spacing-card: 1.5rem`, `--spacing-compact: 1rem`.

## Button Variants

Defined in `src/components/ui/button.tsx` via `class-variance-authority`:

| Variant            | Classes                                                                                 | When to Use             |
| ------------------ | --------------------------------------------------------------------------------------- | ----------------------- |
| `default`          | `bg-primary text-primary-foreground hover:bg-primary/90`                                | Primary actions         |
| `destructive`      | `bg-destructive text-destructive-foreground hover:bg-destructive/90`                    | Delete/danger           |
| `outline`          | `border border-input bg-background hover:bg-accent hover:text-accent-foreground`        | Secondary actions       |
| `secondary`        | `bg-secondary text-secondary-foreground hover:bg-secondary/80`                          | Tertiary actions        |
| `ghost`            | `hover:bg-accent hover:text-accent-foreground`                                          | Minimal/inline actions  |
| `link`             | `text-primary underline-offset-4 hover:underline`                                       | Text links              |
| `primary-custom`   | `bg-primary-custom text-primary-custom-foreground hover:bg-primary-custom/90 shadow-md` | Theme-colored primary   |
| `secondary-custom` | `bg-secondary-custom text-secondary-custom-foreground hover:bg-secondary-custom/90`     | Theme-colored secondary |

**Sizes**: `default` (h-10), `sm` (h-9), `lg` (h-11), `icon` (h-10 w-10)

### ⚠️ Pitfall: Outline/Ghost variants override `hover:text-*`

The `outline` and `ghost` variants both bake in `hover:bg-accent hover:text-accent-foreground` (white). If you add a custom `hover:bg-…` to the className without ALSO setting `hover:text-…`, the white text will appear on your custom (often pale) background and become unreadable — the "washout" bug.

❌ **Wrong** — text becomes white on `secondary-custom/10` (near-white) on hover:

```tsx
<Button
  variant="outline"
  className="border-secondary-custom text-secondary-custom hover:bg-secondary-custom/10"
/>
```

✅ **Right** — explicitly hold the text and border colors on hover:

```tsx
<Button
  variant="outline"
  className="border-secondary-custom text-secondary-custom hover:bg-secondary-custom/10 hover:text-secondary-custom hover:border-secondary-custom"
/>
```

**Rule of thumb**: any time you put a themed `text-*` on an `outline` or `ghost` button, you must add a matching `hover:text-*` (and usually `hover:border-*`) to defeat the variant's defaults.

### Themed Outline Buttons (canonical recipe)

When a secondary action needs a themed border + text in the toolbar (e.g. "Add Asset", "Add Table"), use this exact recipe — no `border-2`, full hover overrides, semantic tokens elsewhere:

```tsx
// Primary-themed outline button
<Button
  variant="outline"
  size="sm"
  className="border-primary-custom text-primary-custom
             hover:bg-primary-custom/10 hover:text-primary-custom hover:border-primary-custom"
/>

// Secondary-themed outline button
<Button
  variant="outline"
  size="sm"
  className="border-secondary-custom text-secondary-custom
             hover:bg-secondary-custom/10 hover:text-secondary-custom hover:border-secondary-custom"
/>
```

Notes:

- Use `border` (1px), not `border-2`. Equal weight to other outline buttons in the toolbar.
- Hover background uses `/10` opacity — subtle tint, not full fill.
- The same pattern works for `destructive` themed outline buttons (`text-destructive`, `hover:bg-destructive/10`, `hover:text-destructive`).

## Badge Variants

Defined in `src/components/ui/badge.tsx`:

| Variant       | Classes                                                              |
| ------------- | -------------------------------------------------------------------- |
| `default`     | `bg-primary text-primary-foreground hover:bg-primary/80`             |
| `secondary`   | `bg-secondary text-secondary-foreground hover:bg-secondary/80`       |
| `destructive` | `bg-destructive text-destructive-foreground hover:bg-destructive/80` |
| `outline`     | `text-foreground` (border only)                                      |

## Custom Utility Classes

Defined via `@utility` in `src/index.css`:

| Class                    | Purpose                                                                 |
| ------------------------ | ----------------------------------------------------------------------- |
| `card-elevated`          | Professional card with gradient background + shadow + ring              |
| `card-panel`             | Muted background panel                                                  |
| `btn-primary-enhanced`   | Gradient primary button with shadow + scale hover                       |
| `btn-secondary-enhanced` | Secondary button with shadow + subtle scale hover                       |
| `guest-tile`             | Draggable guest card (gradient bg, hover ring + shadow + scale)         |
| `nav-glass`              | Glassmorphic navbar (blur + semi-transparent white)                     |
| `stats-card`             | Stats card with gradient + shadow                                       |
| `form-enhanced`          | Form container (`space-y-6`)                                            |
| `form-group-enhanced`    | Form field group (`space-y-2`)                                          |
| `table-enhanced`         | Data table container                                                    |
| `table-row-enhanced`     | Table row with muted hover                                              |
| `skeleton-enhanced`      | Loading skeleton placeholder                                            |
| `focus-enhanced`         | Standard focus ring (`focus-visible:ring-2 ring-primary ring-offset-2`) |

## Hover & Focus Conventions

### Hover Patterns

- **Filled buttons** (default/primary/secondary/destructive): `hover:bg-{color}/90` (slightly darker fill)
- **Outline/ghost buttons with themed colors**: `hover:bg-{color}/10` (subtle tint) — and you MUST also set `hover:text-{color}` (see Pitfall above)
- **Cards/tiles**: `hover:shadow-md hover:ring-primary/20 hover:scale-[1.01]`
- **Menu items**: `hover:bg-accent/10` with `group-hover:text-foreground` for description text
- **Links**: `hover:underline` or `hover:text-primary`
- **Rows**: `hover:bg-muted/50`

### Color Tokens (no raw grays / hex)

Never write `text-gray-700`, `bg-gray-100`, `border-gray-200`, or hex values in component files — these don't follow the theme and silently break in dark mode. Use the semantic token instead:

**Neutral grays → semantic tokens:**

| Don't                             | Do                                                                         | Notes                          |
| --------------------------------- | -------------------------------------------------------------------------- | ------------------------------ |
| `text-gray-900` / `text-gray-800` | `text-foreground`                                                          | Headings, primary text, values |
| `text-gray-700`                   | `text-foreground`                                                          | Body emphasis                  |
| `text-gray-600` / `text-gray-500` | `text-muted-foreground`                                                    | Captions, labels, secondary    |
| `text-gray-400` / `text-gray-300` | `text-muted-foreground/70`                                                 | Disabled placeholders / icons  |
| `bg-white`                        | `bg-card` (elevated) or `bg-background` (page) or `bg-popover` (dropdowns) | Pick by purpose                |
| `bg-gray-50`                      | `bg-muted/30`                                                              | Subtle row/cell backgrounds    |
| `bg-gray-100`                     | `bg-muted`                                                                 | Panels, segmented backgrounds  |
| `bg-gray-200`                     | `bg-border` (divider) or `bg-muted`                                        | Pick by purpose                |
| `border-gray-100`                 | `border-border/60`                                                         | Hairline dividers              |
| `border-gray-200`                 | `border-border`                                                            | Standard borders               |
| `border-gray-300`                 | `border-input`                                                             | Form inputs                    |

**Status colors → semantic tokens:**

| Don't                                            | Do                              |
| ------------------------------------------------ | ------------------------------- |
| `text-red-{500-900}`                             | `text-destructive`              |
| `bg-red-{50,100}`                                | `bg-destructive/10`             |
| `border-red-{200,300}`                           | `border-destructive/30`         |
| `text-green-{500-700}`                           | `text-success`                  |
| `bg-green-{50,100}`                              | `bg-success/10`                 |
| `text-amber-{500-900}` / `text-yellow-{500-900}` | `text-warning`                  |
| `bg-amber-{50,100}` / `bg-yellow-{50,100}`       | `bg-warning/10`                 |
| `border-amber-{200,300}`                         | `border-warning/30`             |
| `text-blue-*` (as link/info)                     | `text-primary` or `text-accent` |

### Categorical-Color Escape Hatch

Some modules use raw colors **on purpose** to give categorical data distinct visual identities. These are exempt from the semantic-token rule and should stay raw:

- `src/components/banquet/mealColors.ts` — meal-type swatches (Chicken/Beef/Vegetarian/etc.). One color per category, intentional palette.
- `src/components/seating/asset/roomAssetStyles.ts` — room-asset visual styles (DJ booth, dance floor, bar). One palette per asset type.
- `src/components/seating/asset/assetVisuals.tsx` — skeumorphic notepad detail (intentional yellow paper).
- `src/components/room-setup/ScaleRectangle.tsx` — measurement rectangle (orange = "calibration tool" affordance).
- `src/components/room-setup/StepSetScale.tsx` — wizard step indicator colors (blue/emerald = step states).

If you add another module that genuinely needs categorical colors (charts, tags, pill colors that map to data categories), centralize them in a `*Colors.ts` constants module and add an entry above. **Do not scatter raw color classes through component files** — use the constants.

### Focus Patterns

- Standard: `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`
- Or use: `focus-enhanced` utility class
- Always pair with `focus-visible:outline-hidden`

### Transitions

- Color only: `transition-colors duration-200`
- Color + shadow + scale: `transition-all duration-200`
- Fast (table rows): `transition-colors duration-150`

## Animations

| Class                    | Duration      | Effect                                 |
| ------------------------ | ------------- | -------------------------------------- |
| `animate-fade-in-up`     | 0.5s          | Fade in + slide up 20px                |
| `animate-scale-in`       | 0.3s          | Fade in + scale from 95%               |
| `animate-seat-highlight` | 1.5s infinite | Pulsing yellow glow on seat dot        |
| `animate-seat-flash`     | 0.5s          | Scale up + blue glow flash on seat dot |
| `animate-glow-pulse`     | 1.5s          | Primary-colored text glow pulse        |
| `animate-color-morph`    | 0.8s          | Hue rotation cycle                     |

## Container

The app uses a custom `container` utility (not Tailwind's default):

- `margin-inline: auto; padding-inline: 2rem`
- No max-width until `1400px` breakpoint, then `max-width: 1400px`

## Radius

| Token           | Value                 |
| --------------- | --------------------- |
| `--radius` (lg) | `0.75rem`             |
| `--radius-md`   | `calc(0.75rem - 2px)` |
| `--radius-sm`   | `calc(0.75rem - 4px)` |
