import { test, expect } from '@playwright/test';

test.describe('Job Import Quality Audit', () => {
  test('audit job listings page', async ({ page }) => {
    await page.goto('/jobs');

    // Wait for jobs to load
    await page.waitForTimeout(2000);

    // Take screenshot of jobs listing
    await page.screenshot({ path: 'test-results/audit-jobs-listing.png', fullPage: true });

    // Check for HTML entities in visible text
    const pageContent = await page.content();
    const hasHtmlEntities = pageContent.includes('&amp;nbsp;') ||
                           pageContent.includes('&nbsp;') ||
                           pageContent.includes('&lt;b&gt;');

    console.log('Jobs page loaded');
    console.log('Contains raw HTML entities:', hasHtmlEntities);
  });

  test('audit individual job details', async ({ page }) => {
    await page.goto('/jobs');

    // Wait and click first job
    await page.waitForTimeout(1000);

    const jobLink = page.locator('a[href^="/jobs/"]').first();
    if (await jobLink.isVisible()) {
      await jobLink.click();
      await page.waitForTimeout(1000);

      // Take screenshot of job details
      await page.screenshot({ path: 'test-results/audit-job-details.png', fullPage: true });

      // Get the job description text
      const descriptionEl = page.locator('[data-testid="job-description"], .job-description, .prose, article').first();
      if (await descriptionEl.isVisible()) {
        const descriptionText = await descriptionEl.textContent();
        console.log('Description preview:', descriptionText?.substring(0, 500));
      }

      // Check company info
      const companyEl = page.locator('text=/workable|jobradars|placed-app|ziprecruiter|jazzhr/i').first();
      const hasAggregatorName = await companyEl.isVisible().catch(() => false);
      console.log('Shows aggregator as company name:', hasAggregatorName);
    }
  });

  test('audit external job display', async ({ page }) => {
    // Go directly to jobs page and look for external job indicators
    await page.goto('/jobs');
    await page.waitForTimeout(2000);

    // Look for "External" badges or indicators
    const externalBadge = page.locator('text=/External|Jooble|Apply on/i').first();
    const hasExternalIndicator = await externalBadge.isVisible().catch(() => false);
    console.log('Has external job indicator:', hasExternalIndicator);

    // Screenshot the page
    await page.screenshot({ path: 'test-results/audit-external-jobs.png', fullPage: true });
  });
});
