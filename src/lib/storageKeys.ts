/**
 * Centralized localStorage key registry.
 *
 * All localStorage reads/writes in the app should go through a key defined
 * here. Keeping keys in one place makes collisions obvious, aids grep-ability,
 * and gives us a single chokepoint for future namespacing / migration.
 */

/** Full `AppData` payload (tables, guests, assets, settings, version). */
export const APP_DATA_KEY = 'lovable-seating-app-data';

/** Selected color theme (persisted `ColorTheme` object). */
export const COLOR_THEME_KEY = 'selected-color-theme';

/** User-defined meal option labels. */
export const MEAL_OPTIONS_KEY = 'meal-options';

/** Whether the user has revealed the Banquet Team Summary demo tab. */
export const DEMO_SUMMARY_UNLOCKED_KEY = 'demo_summary_unlocked';

/** First-run welcome notice acknowledged. */
export const FIRST_RUN_NOTICE_KEY = 'first-run-notice-shown';

/** Drag-to-assign coach mark dismissed. */
export const COACHMARK_DRAG_ASSIGN_KEY = 'coachmark-drag-assign-dismissed';
