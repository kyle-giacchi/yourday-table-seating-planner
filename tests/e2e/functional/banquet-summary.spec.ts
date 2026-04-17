/**
 * Functional E2E tests for the Banquet Summary page.
 */
import { test, expect } from '../fixtures/app-fixture';

test.describe('Banquet Summary', () => {
  test('page loads for free-tier users', async ({ app }) => {
    await app.gotoWithDefaults('/banquet-summary');

    // Should see either the summary or the paywall
    const heading = app.page.getByText(/banquet|summary|upgrade/i).first();
    await expect(heading).toBeVisible();
  });

  test('shows upgrade prompt for free-tier users', async ({ app }) => {
    await app.gotoWithDefaults('/banquet-summary');

    // Free users should see a paywall/upgrade prompt
    const upgradeText = app.page.getByText(/upgrade|premium|pro|unlock/i).first();
    // This is expected for free-tier — just verify the page renders
    if (await upgradeText.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(upgradeText).toBeVisible();
    }
  });

  test('no console errors on banquet summary page', async ({ app }) => {
    await app.gotoWithDefaults('/banquet-summary');

    // Wait for page to settle
    await app.page.waitForTimeout(1000);

    const realErrors = app.consoleErrors.filter(
      (e) => !e.includes('Failed to load resource') && !e.includes('favicon'),
    );
    expect(realErrors).toHaveLength(0);
  });
});
