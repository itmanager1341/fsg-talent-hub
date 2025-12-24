import { test, expect } from '@playwright/test';
import { ROUTES } from '../fixtures/test-data';

test.describe('External Job Data Quality', () => {
  test('companies page displays proper company information', async ({ page }) => {
    await page.goto(ROUTES.companies);

    // Should see companies page heading
    await expect(page.locator('h1')).toBeVisible();

    // Check that companies are displayed (not job board domains)
    const companyCards = page.locator('[data-testid="company-card"], .company-card, a[href^="/companies/"]');

    // Wait for page to load
    await page.waitForTimeout(1000);

    // Check for real company names (not job board domains)
    const pageContent = await page.content();

    // These should NOT appear as company names
    const badCompanyNames = ['placed-app.com', 'jazzhr.com', 'ey.com', 'ziprecruiter.com', 'jobradars.com'];
    for (const badName of badCompanyNames) {
      // Allow in URLs but not as visible company names
      const visibleBadName = await page.locator(`text="${badName}"`).count();
      expect(visibleBadName).toBe(0);
    }
  });

  test('job details page shows correct company for external job', async ({ page }) => {
    // Navigate to jobs page first
    await page.goto(ROUTES.jobs);
    await page.waitForTimeout(1000);

    // Find and click on a job card
    const jobLink = page.locator('a[href^="/jobs/"]').first();
    if (await jobLink.isVisible()) {
      await jobLink.click();
      await page.waitForURL(/\/jobs\//);

      // Should see job title
      await expect(page.locator('h1')).toBeVisible();

      // Check for External badge if this is an external job
      const externalBadge = page.locator('text=External');
      const isExternal = await externalBadge.isVisible();

      if (isExternal) {
        // External jobs should have "Apply on Company Site" button
        await expect(page.locator('text=Apply on Company Site').first()).toBeVisible();

        // Should show company name (not job board domain)
        const companyName = page.locator('p.text-lg.text-gray-600').first();
        const companyText = await companyName.textContent();

        // Company name should not be a job board domain
        expect(companyText).not.toMatch(/\.(com|net|org)$/);
      }
    }
  });

  test('Travel Nurse job shows Premier Medical Staffing Services as company', async ({ page }) => {
    // Direct navigation to a known external job
    await page.goto(ROUTES.jobs);
    await page.waitForTimeout(1000);

    // Search for Travel Nurse
    const searchInput = page.locator('input[type="text"], input[name="q"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('Travel Nurse');
      await searchInput.press('Enter');
      await page.waitForTimeout(1500);
    }

    // Look for the job in results
    const travelNurseJob = page.locator('text=Travel Nurse RN').first();
    if (await travelNurseJob.isVisible()) {
      await travelNurseJob.click();
      await page.waitForTimeout(1000);

      // Verify company name
      const companyName = page.locator('p.text-lg.text-gray-600').first();
      await expect(companyName).toContainText('Premier Medical Staffing Services');

      // Should NOT show ziprecruiter.com
      const pageContent = await page.content();
      expect(pageContent).not.toContain('>ziprecruiter.com<');
    }
  });

  test('external job description is displayed (even if truncated)', async ({ page }) => {
    await page.goto(ROUTES.jobs);
    await page.waitForTimeout(1000);

    // Click on first job
    const jobLink = page.locator('a[href^="/jobs/"]').first();
    await jobLink.click();
    await page.waitForURL(/\/jobs\//);

    // Check for job description section
    const descriptionSection = page.locator('text=Job Description');
    await expect(descriptionSection).toBeVisible();

    // Description should have some content
    const descriptionContent = page.locator('.whitespace-pre-wrap').first();
    const descText = await descriptionContent.textContent();

    // Should have meaningful content (more than 50 chars)
    expect(descText?.length).toBeGreaterThan(50);

    // Should not contain raw HTML entities
    expect(descText).not.toMatch(/&nbsp;|&amp;|&lt;|&gt;/);

    // Should not contain HTML tags as text
    expect(descText).not.toMatch(/<b>|<\/b>|<i>|<\/i>/);
  });

  test('job listing cards show correct company names', async ({ page }) => {
    await page.goto(ROUTES.jobs);
    await page.waitForTimeout(1500);

    // Get all job cards
    const jobCards = page.locator('a[href^="/jobs/"] .text-sm.text-gray-600');
    const count = await jobCards.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      const companyText = await jobCards.nth(i).textContent();

      // Should not be a job board domain
      expect(companyText).not.toMatch(/placed-app\.com|jazzhr\.com|ey\.com|ziprecruiter\.com|jobradars\.com/);

      // Should have a real company name (not empty)
      expect(companyText?.trim().length).toBeGreaterThan(0);
    }
  });

  test('external job has working external URL', async ({ page }) => {
    await page.goto(ROUTES.jobs);
    await page.waitForTimeout(1000);

    // Click on first job
    const jobLink = page.locator('a[href^="/jobs/"]').first();
    await jobLink.click();
    await page.waitForURL(/\/jobs\//);

    // Check if this is an external job
    const applyButton = page.locator('text=Apply on Company Site').first();
    if (await applyButton.isVisible()) {
      // Get the href
      const href = await applyButton.locator('..').getAttribute('href');

      // Should have a valid external URL
      expect(href).toBeTruthy();
      expect(href).toMatch(/^https?:\/\//);
    }
  });
});
