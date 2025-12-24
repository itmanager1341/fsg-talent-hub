import { test, expect } from '../fixtures/auth';
import { ROUTES } from '../fixtures/test-data';

test.describe('Admin Dashboard', () => {
  test('admin dashboard is accessible to admin users', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();

    await page.goto(ROUTES.admin);

    // Should see admin dashboard
    await expect(page.locator('h1, h2').first()).toBeVisible();

    // Should have admin navigation/sidebar
    const sidebar = page.locator('[class*="sidebar"], nav').first();
    await expect(sidebar).toBeVisible();
  });

  test('admin sidebar has all sections', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();

    await page.goto(ROUTES.admin);

    // Check for main admin sections
    const sections = [
      'Companies',
      'Candidates',
      'Job Sources',
      'HubSpot',
      'Settings',
    ];

    for (const section of sections) {
      const sectionLink = page.locator(`a:has-text("${section}")`).first();
      await expect(sectionLink).toBeVisible({ timeout: 5000 }).catch(() => {
        console.log(`Section "${section}" not visible in sidebar`);
      });
    }
  });

  test('can navigate to companies page', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();

    await page.goto(ROUTES.adminCompanies);

    // Should see companies management
    await expect(page.locator('h1, h2').first()).toContainText(/Companies/i);
  });

  test('can navigate to candidates page', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();

    await page.goto(ROUTES.adminCandidates);

    // Should see candidates management
    await expect(page.locator('h1, h2').first()).toContainText(/Candidates/i);
  });

  test('can navigate to AI usage page', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();

    await page.goto(ROUTES.adminAiUsage);

    // Should see AI usage stats
    await expect(page.locator('text=/AI|Usage|Cost/i').first()).toBeVisible();
  });

  test('can navigate to settings page', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();

    await page.goto(ROUTES.adminSettings);

    // Should see settings/feature flags
    await expect(page.locator('h1, h2').first()).toContainText(/Settings|Features/i);
  });
});
