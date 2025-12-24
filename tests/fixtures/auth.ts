import { test as base, expect, type Page } from '@playwright/test';
import { TEST_USERS, ROUTES } from './test-data';

/**
 * Authentication helpers for E2E tests
 */

export type UserRole = 'candidate' | 'employer' | 'admin';

/**
 * Login as a specific user role
 */
export async function loginAs(page: Page, role: UserRole): Promise<void> {
  const user = TEST_USERS[role];

  await page.goto(ROUTES.signin);

  // Wait for the sign-in form to be ready
  await page.waitForSelector('input[type="email"]');

  // Fill in credentials
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);

  // Submit the form
  await page.click('button[type="submit"]');

  // Wait for redirect after successful login
  // The redirect destination depends on user role
  await page.waitForURL((url) => !url.pathname.includes('/signin'), {
    timeout: 10000,
  });
}

/**
 * Logout the current user
 */
export async function logout(page: Page): Promise<void> {
  await page.goto(ROUTES.signout);

  // Wait for redirect to home or signin
  await page.waitForURL((url) =>
    url.pathname === '/' || url.pathname === '/signin'
  );
}

/**
 * Check if user is logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  // Look for sign out button or user menu in header
  const signOutButton = page.locator('button:has-text("Sign Out"), a:has-text("Sign Out")');
  return await signOutButton.isVisible({ timeout: 2000 }).catch(() => false);
}

/**
 * Extended test fixture with auth helpers
 */
export const test = base.extend<{
  loginAsCandidate: () => Promise<void>;
  loginAsEmployer: () => Promise<void>;
  loginAsAdmin: () => Promise<void>;
}>({
  loginAsCandidate: async ({ page }, use) => {
    const login = async () => {
      await loginAs(page, 'candidate');
    };
    await use(login);
  },

  loginAsEmployer: async ({ page }, use) => {
    const login = async () => {
      await loginAs(page, 'employer');
    };
    await use(login);
  },

  loginAsAdmin: async ({ page }, use) => {
    const login = async () => {
      await loginAs(page, 'admin');
    };
    await use(login);
  },
});

export { expect };
