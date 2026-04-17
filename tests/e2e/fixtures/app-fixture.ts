/**
 * Custom Playwright fixture that provides an `app` helper for:
 * - Seeding localStorage before page load
 * - Navigating to app routes
 * - Collecting console errors
 */
import { test as base, type Page } from '@playwright/test';
import { type AppData, STORAGE_KEY, buildAppData, resetIdCounter } from './test-data';

export interface AppFixture {
  /** Seed localStorage and navigate to a route. */
  goto(path: string, opts?: { seed?: Partial<AppData> }): Promise<void>;
  /** Seed localStorage with custom AppData, then navigate. */
  seedAndGoto(appData: AppData, path: string): Promise<void>;
  /** Navigate to a route using default sample data (no seeding). */
  gotoWithDefaults(path: string): Promise<void>;
  /** Console errors collected during the test. */
  consoleErrors: string[];
  /** The underlying Playwright page. */
  page: Page;
}

export const test = base.extend<{ app: AppFixture }>({
  app: async ({ page }, use) => {
    resetIdCounter();

    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    const app: AppFixture = {
      page,
      consoleErrors,

      async goto(path, opts) {
        const appData = buildAppData(opts?.seed ?? {});
        await injectAndNavigate(page, appData, path);
      },

      async seedAndGoto(appData, path) {
        await injectAndNavigate(page, appData, path);
      },

      async gotoWithDefaults(path) {
        await page.goto(path);
        await page.waitForLoadState('networkidle');
      },
    };

    await use(app);
  },
});

export { expect } from '@playwright/test';

// ---- Helpers ----

async function injectAndNavigate(page: Page, appData: AppData, path: string) {
  // Navigate to a blank page first so we have a browsing context
  // for localStorage injection
  await page.goto('/');

  // Inject data into localStorage
  await page.evaluate(
    ({ key, data }) => {
      localStorage.setItem(key, JSON.stringify(data));
    },
    { key: STORAGE_KEY, data: appData },
  );

  // Navigate to the target path — the app will pick up seeded data
  await page.goto(path);
  await page.waitForLoadState('networkidle');
}
