import { test, expect } from '../fixtures/auth';
import { ROUTES } from '../fixtures/test-data';

test.describe('Applicant Management', () => {
  test('can access settings page', async ({ page, loginAsEmployer }) => {
    await loginAsEmployer();

    await page.goto(ROUTES.employerSettings);

    // Should see settings page
    await expect(page.locator('h1')).toContainText(/Settings/i);

    // Should have form fields
    await expect(page.locator('input[name="name"]').first()).toBeVisible();
  });

  test('can access team management page', async ({ page, loginAsEmployer }) => {
    await loginAsEmployer();

    await page.goto(ROUTES.employerTeam);

    // Should see team page
    await expect(page.locator('h1')).toContainText(/Team/i);

    // Should show team member info (current user marked as "You")
    await expect(page.getByText('You', { exact: true })).toBeVisible();
  });

  test('can access candidate search', async ({ page, loginAsEmployer }) => {
    await loginAsEmployer();

    await page.goto(ROUTES.employerCandidates);

    // Should either show candidate search or upgrade prompt
    const content = page.locator('body');
    const hasSearch = await content.locator('text=Search').isVisible().catch(() => false);
    const hasUpgrade = await content.locator('text=Upgrade').isVisible().catch(() => false);

    expect(hasSearch || hasUpgrade).toBeTruthy();
  });

  test('can access billing page', async ({ page, loginAsEmployer }) => {
    await loginAsEmployer();

    await page.goto(ROUTES.employerBilling);

    // Should see billing/subscription content
    await expect(page.locator('text=/Billing|Plan|Subscription/i').first()).toBeVisible();
  });
});
