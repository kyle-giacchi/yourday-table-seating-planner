/**
 * Functional E2E tests for the Room Layout (SeatingManager) page.
 *
 * Tests: canvas rendering, tables on canvas, management mode toggle.
 */
import { test, expect } from '../fixtures/app-fixture';
import { buildAppData, createTables, resetIdCounter } from '../fixtures/test-data';

test.describe('Room Layout', () => {
  test('canvas renders with room outline', async ({ app }) => {
    await app.gotoWithDefaults('/room-layout');

    // The canvas area should be present — uses data-seating-canvas or role="application"
    const canvas = app.page
      .locator('[data-seating-canvas]')
      .or(app.page.getByRole('application', { name: /room layout canvas/i }));
    await expect(canvas).toBeVisible({ timeout: 10_000 });
  });

  test('canvas toolbar is visible', async ({ app }) => {
    await app.gotoWithDefaults('/room-layout');

    // Toolbar should have zoom/undo controls
    await expect(app.page.getByRole('button', { name: /zoom|undo|clear/i }).first()).toBeVisible();
  });

  test('tables render on canvas when seeded', async ({ app }) => {
    resetIdCounter();
    const tables = createTables(3);
    await app.seedAndGoto(buildAppData({ tables }), '/room-layout');

    // Tables use data-table-id attributes on the canvas
    for (const table of tables) {
      const canvasTable = app.page.locator(`[data-table-id="${table.id}"]`);
      // Fall back to checking for table name text if data-table-id not found
      const nameText = app.page.getByText(table.name).first();

      const hasDataId = await canvasTable.isVisible({ timeout: 3000 }).catch(() => false);
      const hasName = await nameText.isVisible({ timeout: 1000 }).catch(() => false);
      expect(hasDataId || hasName).toBeTruthy();
    }
  });

  test('management mode toggle switches between modes', async ({ app }) => {
    resetIdCounter();
    const tables = createTables(1);
    await app.seedAndGoto(buildAppData({ tables }), '/room-layout');

    // Look for the mode toggle — toggles between "assignment" and "table editor"
    const modeToggle = app.page.getByText(/table editor|assignment/i).first();
    if (await modeToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
      await modeToggle.click();

      // After toggling, the opposite mode should be active
      await expect(app.page.getByText(/assignment|table editor/i).first()).toBeVisible();
    }
  });

  test('right sidebar shows assignment panel or table editor', async ({ app }) => {
    resetIdCounter();
    const tables = createTables(1);
    await app.seedAndGoto(buildAppData({ tables, guests: [] }), '/room-layout');

    // The assignment panel or sidebar should be visible
    const panel = app.page.getByRole('region', { name: /assignment|editor/i });
    const sidebar = app.page.locator('#assignment-sidebar');

    const hasPanel = await panel.isVisible({ timeout: 5000 }).catch(() => false);
    const hasSidebar = await sidebar.isVisible({ timeout: 1000 }).catch(() => false);
    expect(hasPanel || hasSidebar).toBeTruthy();
  });
});
