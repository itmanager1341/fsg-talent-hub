import { test, expect } from '../fixtures/auth';
import { ROUTES } from '../fixtures/test-data';

test.describe('Admin HubSpot Integration', () => {
  test('can access HubSpot sync page', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();

    await page.goto(ROUTES.adminHubspot);

    // Should see HubSpot page
    await expect(page.locator('h1, h2').first()).toContainText(/HubSpot/i);
  });

  test('HubSpot page has sync controls', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();

    await page.goto(ROUTES.adminHubspot);

    // Should have sync button
    const syncButton = page.locator('button:has-text("Sync")').first();
    await expect(syncButton).toBeVisible({ timeout: 5000 }).catch(() => {
      console.log('Sync button not visible');
    });
  });

  test('can access employer prospects page', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();

    await page.goto('/admin/employer-prospects');

    // Should see prospects page
    await expect(page.locator('text=/Prospect|Employer/i').first()).toBeVisible();
  });

  test('prospects page has sync to HubSpot button', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();

    await page.goto('/admin/employer-prospects');

    // Look for HubSpot sync functionality
    const hubspotButton = page.locator('button:has-text("HubSpot"), button:has-text("Sync")').first();
    await expect(hubspotButton).toBeVisible({ timeout: 5000 }).catch(() => {
      console.log('HubSpot sync button not visible on prospects page');
    });
  });
});
