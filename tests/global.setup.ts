import { test as setup } from '@playwright/test';

/**
 * Global Setup for E2E Tests
 *
 * This runs once before all tests to:
 * - Verify the dev server is running
 * - Seed any required test data
 * - Set up authentication state if needed
 */

setup('verify server is running', async ({ page }) => {
  // Navigate to homepage to verify server is up
  const response = await page.goto('/');

  if (!response || !response.ok()) {
    throw new Error(
      'Failed to reach dev server. Make sure "npm run dev" is running.'
    );
  }

  console.log('✅ Dev server is running');
});

setup('verify database connection', async ({ page }) => {
  // Try to load the jobs page to verify database is accessible
  const response = await page.goto('/jobs');

  if (!response || !response.ok()) {
    throw new Error(
      'Failed to load jobs page. Check database connection.'
    );
  }

  console.log('✅ Database connection verified');
});

/**
 * Note: Test user creation should be done via Supabase dashboard or SQL script.
 *
 * Required test users:
 * - test-candidate@example.com (role: candidate)
 * - test-employer@example.com (role: employer, with company)
 * - test-admin@example.com (role: admin)
 *
 * Run this SQL in Supabase to create the admin role:
 *
 * INSERT INTO user_roles (user_id, role)
 * SELECT id, 'admin' FROM auth.users WHERE email = 'test-admin@example.com'
 * ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
 */
