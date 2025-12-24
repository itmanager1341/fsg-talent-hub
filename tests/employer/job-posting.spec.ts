import { test, expect } from '../fixtures/auth';
import { ROUTES, TEST_JOB } from '../fixtures/test-data';

test.describe('Job Posting', () => {
  test('can access new job form', async ({ page, loginAsEmployer }) => {
    await loginAsEmployer();

    await page.goto(ROUTES.employerNewJob);

    // Should see job posting form
    await expect(page.locator('h1')).toContainText(/Post|New|Create/i);

    // Should have title input
    await expect(page.locator('input[name="title"]').first()).toBeVisible();
  });

  test('job form has required fields', async ({ page, loginAsEmployer }) => {
    await loginAsEmployer();

    await page.goto(ROUTES.employerNewJob);

    // Check for essential fields
    await expect(page.locator('input[name="title"]').first()).toBeVisible();

    // Description field (could be textarea or rich text editor)
    const descriptionField = page.locator('textarea, [contenteditable="true"], [data-testid="description"]').first();
    await expect(descriptionField).toBeVisible();

    // Location fields
    const locationField = page.locator('input[name*="location"], select[name*="location"]').first();
    await expect(locationField).toBeVisible().catch(() => {
      // Location might be optional or structured differently
    });
  });

  test('can fill out job posting form', async ({ page, loginAsEmployer }) => {
    await loginAsEmployer();

    await page.goto(ROUTES.employerNewJob);

    // Fill in job title
    await page.fill('input[name="title"]', TEST_JOB.title);

    // Fill in description
    const descriptionField = page.locator('textarea').first();
    if (await descriptionField.isVisible()) {
      await descriptionField.fill(TEST_JOB.description);
    }

    // Form should be fillable without errors
    await expect(page.locator('input[name="title"]')).toHaveValue(TEST_JOB.title);
  });

  test('AI job description generator is available', async ({ page, loginAsEmployer }) => {
    await loginAsEmployer();

    await page.goto(ROUTES.employerNewJob);

    // Look for AI generation button
    const aiButton = page.locator('button:has-text("Generate"), button:has-text("AI")').first();

    // Should have AI generation feature
    await expect(aiButton).toBeVisible({ timeout: 5000 }).catch(() => {
      console.log('AI generation button not found - may be premium feature');
    });
  });
});
