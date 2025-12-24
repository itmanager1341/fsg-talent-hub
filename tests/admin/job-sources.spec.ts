import { test, expect } from '../fixtures/auth';
import { ROUTES } from '../fixtures/test-data';

test.describe('Admin Job Sources', () => {
  test('can access job sources page', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();

    await page.goto(ROUTES.adminJobSources);

    // Should see job sources management
    await expect(page.locator('h1, h2').first()).toContainText(/Job Sources|Sources/i);
  });

  test('job sources page shows source list', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();

    await page.goto(ROUTES.adminJobSources);

    // Should have table or list of sources
    const sourceList = page.locator('table, [class*="list"], [class*="grid"]').first();
    await expect(sourceList).toBeVisible();
  });

  test('can navigate to create new source', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();

    await page.goto(ROUTES.adminJobSources);

    // Find add/create button
    const addButton = page.locator('a:has-text("Add"), a:has-text("New"), button:has-text("Add")').first();

    if (await addButton.isVisible()) {
      await addButton.click();

      // Should navigate to new source page
      await expect(page).toHaveURL(/\/admin\/job-sources\/new/);
    }
  });

  test('can access imports queue', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();

    await page.goto('/admin/job-sources/imports');

    // Should see imports page
    await expect(page.locator('text=/Import|Queue/i').first()).toBeVisible();
  });

  test('can access quality dashboard', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();

    await page.goto('/admin/job-sources/quality');

    // Should see quality metrics
    await expect(page.locator('text=/Quality|Metrics|Score/i').first()).toBeVisible();
  });

  test('can access feeds management', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();

    await page.goto('/admin/job-sources/feeds');

    // Should see feeds page
    await expect(page.locator('text=/Feed|RSS/i').first()).toBeVisible();
  });
});
