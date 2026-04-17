/**
 * Smoke tests — verify every route loads without console errors.
 * Uses default sample data (28 guests, no tables).
 */
import { test, expect } from '../fixtures/app-fixture';

const routes = [
  { path: '/', name: 'Home' },
  { path: '/room-layout', name: 'Room Layout' },
  { path: '/seat-assignments', name: 'Seat Assignments' },
  { path: '/guest-management', name: 'Guest Management' },
  { path: '/banquet-summary', name: 'Banquet Summary' },
  { path: '/room-setup', name: 'Room Setup' },
] as const;

for (const route of routes) {
  test(`${route.name} (${route.path}) loads without errors`, async ({ app }) => {
    await app.gotoWithDefaults(route.path);

    // Page should not show the "Loading..." fallback
    await expect(app.page.getByText('Loading...')).not.toBeVisible({ timeout: 10_000 });

    // No console errors
    const realErrors = app.consoleErrors.filter(
      (e) => !e.includes('Failed to load resource') && !e.includes('favicon'),
    );
    expect(realErrors).toHaveLength(0);
  });
}

test('Home page has navigation links to main sections', async ({ app }) => {
  await app.gotoWithDefaults('/');

  await expect(app.page.getByRole('link', { name: /room layout/i })).toBeVisible();
  await expect(app.page.getByRole('link', { name: /seat assignments/i })).toBeVisible();
  await expect(app.page.getByRole('link', { name: /guest management/i })).toBeVisible();
});

test('Top navbar renders brand and navigation', async ({ app }) => {
  await app.gotoWithDefaults('/');

  await expect(app.page.getByText('YourDay')).toBeVisible();
  await expect(app.page.getByRole('link', { name: /room layout/i })).toBeVisible();
  await expect(app.page.getByRole('link', { name: /guest management/i })).toBeVisible();
});

test('404 page renders for unknown routes', async ({ app }) => {
  await app.gotoWithDefaults('/this-does-not-exist');

  await expect(app.page.getByRole('heading', { name: '404' })).toBeVisible();
});
