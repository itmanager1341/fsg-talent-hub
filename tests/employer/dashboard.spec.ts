import { test, expect } from '../fixtures/auth';
import { ROUTES } from '../fixtures/test-data';

test.describe('Employer Dashboard', () => {
  test('employer landing page is accessible', async ({ page }) => {
    await page.goto(ROUTES.employers);

    // Should show employer landing content
    await expect(page.locator('h1')).toBeVisible();

    // Should have pricing or CTA
    await expect(page.locator('text=/Post|Hire|Recruit/i').first()).toBeVisible();
  });

  test('can access employer dashboard when logged in', async ({ page, loginAsEmployer }) => {
    await loginAsEmployer();

    await page.goto(ROUTES.employerDashboard);

    // Should see dashboard with company name or welcome
    await expect(page.locator('h1, h2').first()).toBeVisible();

    // Should see main content area
    await expect(page.locator('main, [role="main"], .dashboard').first()).toBeVisible();
  });

  test('dashboard shows job listings', async ({ page, loginAsEmployer }) => {
    await loginAsEmployer();

    await page.goto(ROUTES.employerDashboard);

    // Should have jobs section
    await expect(page.locator('text=/Your Jobs|Job Postings|Posted Jobs/i')).toBeVisible();
  });

  test('can navigate to post new job', async ({ page, loginAsEmployer }) => {
    await loginAsEmployer();

    await page.goto(ROUTES.employerDashboard);

    // Find and click Post Job button
    const postJobButton = page.locator('a:has-text("Post"), button:has-text("Post")').first();

    if (await postJobButton.isVisible()) {
      await postJobButton.click();

      // Should navigate to new job page
      await expect(page).toHaveURL(/\/employers\/jobs\/new/);
    }
  });
});
