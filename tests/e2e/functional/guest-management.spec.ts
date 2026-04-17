/**
 * Functional E2E tests for the Guest Management page.
 *
 * Tests: adding a guest, editing a guest, search/filter, stats card.
 */
import { test, expect } from '../fixtures/app-fixture';
import { createGuests } from '../fixtures/test-data';

test.describe('Guest Management', () => {
  test('displays default sample guests on first visit', async ({ app }) => {
    await app.gotoWithDefaults('/guest-management');

    // Default data has 28 guests — stats card shows "28" next to "guests"
    await expect(app.page.getByText('28').first()).toBeVisible();
    // Verify the word "guests" is nearby
    await expect(app.page.getByText('guests').first()).toBeVisible();
  });

  test('add a new guest via form modal', async ({ app }) => {
    // Seed with a small set so we can easily verify the addition
    const guests = createGuests(3);
    await app.goto('/guest-management', { seed: { guests } });

    // Open the "Add Guest" modal
    await app.page.getByRole('button', { name: /add guest/i }).click();

    // Wait for dialog to appear
    await expect(app.page.getByRole('dialog')).toBeVisible();

    // Fill out the form — scope to dialog to avoid sort button label conflicts
    const dialog = app.page.getByRole('dialog');
    await dialog.getByLabel('First Name').fill('Test');
    await dialog.getByLabel('Last Name').fill('Guest');
    await dialog.getByLabel('Party').fill('E2E Party');

    // Submit — button text is "Add Guest"
    await dialog.getByRole('button', { name: 'Add Guest' }).click();

    // Guest should appear in the grid — check within the table
    const table = app.page.getByRole('table');
    await expect(table.getByRole('cell', { name: 'Test', exact: true })).toBeVisible();
  });

  test('edit an existing guest', async ({ app }) => {
    const guests = createGuests(3);
    await app.goto('/guest-management', { seed: { guests } });

    const fullName = guests[0].fullName;

    // Click edit on the first guest
    await app.page.getByRole('button', { name: new RegExp(`Edit ${fullName}`, 'i') }).click();

    // Wait for dialog
    await expect(app.page.getByRole('dialog')).toBeVisible();

    // Change the first name — scope to dialog to avoid sort button label conflicts
    const dialog = app.page.getByRole('dialog');
    const nameInput = dialog.getByLabel('First Name');
    await nameInput.clear();
    await nameInput.fill('Updated');

    // Save — button text is "Update Guest" in edit mode
    await dialog.getByRole('button', { name: /update guest/i }).click();

    // Updated name should appear in the grid table
    const table = app.page.getByRole('table');
    await expect(table.getByRole('cell', { name: 'Updated', exact: true })).toBeVisible();
  });

  test('search filters guests by name', async ({ app }) => {
    await app.gotoWithDefaults('/guest-management');

    // Search input has placeholder "Search guests..."
    const searchInput = app.page.getByPlaceholder('Search guests...');
    await searchInput.fill('Alice');

    // Alice Johnson should be visible
    await expect(app.page.getByText('Alice')).toBeVisible();

    // Other guests should be filtered out
    await expect(app.page.getByText('Bob')).not.toBeVisible();
  });

  test('stats card shows correct counts', async ({ app }) => {
    const guests = createGuests(5);
    await app.goto('/guest-management', { seed: { guests } });

    // 5 guests — use .first() since the number may appear in multiple stats
    await expect(app.page.getByText('5').first()).toBeVisible();
    await expect(app.page.getByText('guests').first()).toBeVisible();
  });

  test('delete a guest', async ({ app }) => {
    const guests = createGuests(3);
    const firstName = guests[0].firstName!;
    const fullName = guests[0].fullName;
    await app.goto('/guest-management', { seed: { guests } });

    // Verify guest is there — grid shows first/last in separate columns
    await expect(app.page.getByRole('cell', { name: firstName, exact: true })).toBeVisible();

    // Click delete on the first guest (aria-label uses fullName)
    await app.page.getByRole('button', { name: new RegExp(`Delete ${fullName}`, 'i') }).click();

    // Confirm deletion in the AlertDialog
    const confirmButton = app.page.getByRole('button', { name: /confirm|yes|delete|continue/i });
    if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmButton.click();
    }

    // Guest should be gone
    await expect(app.page.getByRole('cell', { name: firstName, exact: true })).not.toBeVisible();
  });
});
