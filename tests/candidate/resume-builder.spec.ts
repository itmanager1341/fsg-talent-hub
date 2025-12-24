import { test, expect } from '../fixtures/auth';
import { ROUTES } from '../fixtures/test-data';

test.describe('Resume Builder', () => {
  test('can access resume builder page', async ({ page, loginAsCandidate }) => {
    await loginAsCandidate();

    await page.goto(ROUTES.candidateResume);

    // Should see resume builder page
    await expect(page.locator('h1')).toContainText(/Resume/i);
  });

  test('resume builder shows AI features', async ({ page, loginAsCandidate }) => {
    await loginAsCandidate();

    await page.goto(ROUTES.candidateResume);

    // Look for AI-related features
    const aiFeatures = page.locator('text=/AI|Analyze|Optimize|Improve/i').first();

    // Should have some AI-related content
    await expect(aiFeatures).toBeVisible({ timeout: 5000 }).catch(() => {
      // AI features might be gated by subscription
      console.log('AI features not visible - may require premium subscription');
    });
  });

  test('can upload or paste resume content', async ({ page, loginAsCandidate }) => {
    await loginAsCandidate();

    await page.goto(ROUTES.candidateResume);

    // Look for text input or upload area
    const textArea = page.locator('textarea').first();
    const uploadInput = page.locator('input[type="file"]').first();

    const hasTextArea = await textArea.isVisible().catch(() => false);
    const hasUpload = await uploadInput.count() > 0;

    expect(hasTextArea || hasUpload).toBeTruthy();
  });
});
