/**
 * Visual regression tests — full-page screenshots per route.
 *
 * Run `npm run test:e2e:update` to regenerate baselines.
 * Uses default sample data for consistency.
 */
import { test, expect } from '../fixtures/app-fixture';
import { buildAppData, createGuests, createTable, resetIdCounter } from '../fixtures/test-data';

test.describe('Visual Regression — Pages', () => {
  const pages = [
    { path: '/', name: 'home' },
    { path: '/guest-management', name: 'guest-management' },
    { path: '/seat-assignments', name: 'seat-assignments' },
    { path: '/room-layout', name: 'room-layout' },
    { path: '/banquet-summary', name: 'banquet-summary' },
    { path: '/room-setup', name: 'room-setup' },
  ] as const;

  for (const page of pages) {
    test(`${page.name} matches baseline`, async ({ app }) => {
      await app.gotoWithDefaults(page.path);

      // Wait for lazy-loaded content and animations to settle
      await app.page.waitForTimeout(1000);

      await expect(app.page).toHaveScreenshot(`${page.name}.png`, {
        fullPage: true,
      });
    });
  }
});

test.describe('Visual Regression — Component States', () => {
  test('guest management with seeded data', async ({ app }) => {
    resetIdCounter();
    const guests = createGuests(8);
    await app.goto('/guest-management', { seed: { guests } });
    await app.page.waitForTimeout(500);

    await expect(app.page).toHaveScreenshot('guest-management-seeded.png', {
      fullPage: true,
    });
  });

  test('seat assignments with tables and guests', async ({ app }) => {
    resetIdCounter();
    const guests = createGuests(6);
    const table1 = createTable({ name: 'Head Table' });
    const table2 = createTable({ name: 'Table 2' });
    // Pre-assign some guests
    table1.guests = guests.slice(0, 3);

    await app.seedAndGoto(
      buildAppData({ guests: guests.slice(3), tables: [table1, table2] }),
      '/seat-assignments',
    );
    await app.page.waitForTimeout(500);

    await expect(app.page).toHaveScreenshot('seat-assignments-with-data.png', {
      fullPage: true,
    });
  });

  test('room layout with tables on canvas', async ({ app }) => {
    resetIdCounter();
    const table1 = createTable({ x: 200, y: 200, name: 'Table 1' });
    const table2 = createTable({ x: 400, y: 300, name: 'Table 2' });
    const table3 = createTable({
      x: 300,
      y: 150,
      name: 'Head Table',
      shape: 'rectangle',
      tableSize: '96" x 30"',
    });

    await app.seedAndGoto(buildAppData({ tables: [table1, table2, table3] }), '/room-layout');
    await app.page.waitForTimeout(1000);

    await expect(app.page).toHaveScreenshot('room-layout-with-tables.png', {
      fullPage: true,
    });
  });

  test('add guest modal open state', async ({ app }) => {
    await app.gotoWithDefaults('/guest-management');

    await app.page.getByRole('button', { name: /add guest/i }).click();
    await app.page.waitForTimeout(300);

    await expect(app.page).toHaveScreenshot('guest-modal-open.png');
  });
});
