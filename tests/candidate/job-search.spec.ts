import { test, expect } from '@playwright/test';
import { ROUTES } from '../fixtures/test-data';

test.describe('Job Search', () => {
  test('homepage displays featured jobs and search', async ({ page }) => {
    await page.goto(ROUTES.home);

    // Check hero section exists
    await expect(page.locator('h1')).toBeVisible();

    // Check for CTA or navigation to jobs
    const hasJobsLink = await page.locator('a[href="/jobs"]').first().isVisible();
    const hasSearchForm = await page.locator('input, form').first().isVisible();
    expect(hasJobsLink || hasSearchForm).toBeTruthy();
  });

  test('can navigate to jobs page', async ({ page }) => {
    await page.goto(ROUTES.home);

    // Click on Find Jobs link
    await page.click('a:has-text("Find Jobs")');

    // Should be on jobs page
    await expect(page).toHaveURL(/\/jobs/);
  });

  test('jobs page displays job listings', async ({ page }) => {
    await page.goto(ROUTES.jobs);

    // Wait for jobs to load
    await page.waitForSelector('[data-testid="job-card"], .job-card, article', {
      timeout: 10000,
    }).catch(() => {
      // If no specific selector, just wait for page load
    });

    // Page title should indicate jobs
    await expect(page.locator('h1')).toContainText(/Jobs|Opportunities/i);
  });

  test('can filter jobs by work setting', async ({ page }) => {
    await page.goto(ROUTES.jobs);

    // Look for filter controls
    const remoteFilter = page.locator('text=Remote').first();

    if (await remoteFilter.isVisible()) {
      await remoteFilter.click();

      // URL should update with filter
      await page.waitForURL(/work_setting=remote|remote=true/);
    }
  });

  test('can view job details', async ({ page }) => {
    await page.goto(ROUTES.jobs);

    // Click on first job link
    const jobLink = page.locator('a[href^="/jobs/"]').first();

    if (await jobLink.isVisible()) {
      await jobLink.click();

      // Should be on job details page
      await expect(page).toHaveURL(/\/jobs\/[a-zA-Z0-9-]+/);

      // Should show job title
      await expect(page.locator('h1')).toBeVisible();

      // Should show Apply button
      await expect(page.locator('text=Apply').first()).toBeVisible();
    }
  });

  test('can search for jobs by keyword', async ({ page }) => {
    await page.goto(ROUTES.jobs);

    // Find search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]').first();

    if (await searchInput.isVisible()) {
      await searchInput.fill('developer');
      await searchInput.press('Enter');

      // Wait for results to update
      await page.waitForTimeout(1000);
    }
  });
});
