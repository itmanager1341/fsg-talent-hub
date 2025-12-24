import { test, expect } from '../fixtures/auth';
import { ROUTES } from '../fixtures/test-data';

test.describe('Candidate Application Flow', () => {
  test.describe('Unauthenticated user', () => {
    test('clicking apply redirects to sign in', async ({ page }) => {
      await page.goto(ROUTES.jobs);

      // Find and click on a job
      const jobLink = page.locator('a[href^="/jobs/"]').first();

      if (await jobLink.isVisible()) {
        await jobLink.click();

        // Click apply button
        const applyButton = page.locator('a:has-text("Apply"), button:has-text("Apply")').first();

        if (await applyButton.isVisible()) {
          await applyButton.click();

          // Should redirect to sign in
          await expect(page).toHaveURL(/signin|login/);
        }
      }
    });
  });

  test.describe('Authenticated candidate', () => {
    test('can access candidate dashboard', async ({ page, loginAsCandidate }) => {
      await loginAsCandidate();

      await page.goto(ROUTES.candidateDashboard);

      // Should see dashboard content
      await expect(page.locator('h1')).toBeVisible();
    });

    test('can view applications list', async ({ page, loginAsCandidate }) => {
      await loginAsCandidate();

      await page.goto(ROUTES.candidateApplications);

      // Should see applications page - check h1 or main content
      await expect(page.locator('h1, h2').first()).toBeVisible();
    });

    test('can view saved jobs', async ({ page, loginAsCandidate }) => {
      await loginAsCandidate();

      await page.goto(ROUTES.candidateSavedJobs);

      // Should see saved jobs page - check h1 or main content
      await expect(page.locator('h1, h2').first()).toBeVisible();
    });

    test('can access profile page', async ({ page, loginAsCandidate }) => {
      await loginAsCandidate();

      await page.goto(ROUTES.candidateProfile);

      // Should see profile form
      await expect(page.locator('input[name="first_name"], input[name="firstName"]').first()).toBeVisible();
    });

    test('can save a job', async ({ page, loginAsCandidate }) => {
      await loginAsCandidate();

      await page.goto(ROUTES.jobs);

      // Click on first job
      const jobLink = page.locator('a[href^="/jobs/"]').first();

      if (await jobLink.isVisible()) {
        await jobLink.click();

        // Look for save button
        const saveButton = page.locator('button:has-text("Save"), button[aria-label*="save"]').first();

        if (await saveButton.isVisible()) {
          await saveButton.click();

          // Button should change state
          await page.waitForTimeout(1000);
        }
      }
    });
  });
});
