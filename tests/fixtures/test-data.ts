/**
 * Test Data for E2E Tests
 *
 * Credentials are loaded from environment variables for security.
 * Set these in your .env.local or CI environment:
 *   - TEST_CANDIDATE_EMAIL
 *   - TEST_CANDIDATE_PASSWORD
 *   - TEST_EMPLOYER_EMAIL
 *   - TEST_EMPLOYER_PASSWORD
 *   - TEST_ADMIN_EMAIL
 *   - TEST_ADMIN_PASSWORD
 */

export const TEST_USERS = {
  candidate: {
    email: process.env.TEST_CANDIDATE_EMAIL || 'candidate2@test.com',
    password: process.env.TEST_CANDIDATE_PASSWORD || 'TestPassword123!',
    firstName: 'Test',
    lastName: 'Candidate',
  },
  employer: {
    email: process.env.TEST_EMPLOYER_EMAIL || 'employer2@test.com',
    password: process.env.TEST_EMPLOYER_PASSWORD || 'TestPassword123!',
    companyName: 'Test Employer Co',
  },
  admin: {
    email: process.env.TEST_ADMIN_EMAIL || 'admin2@test.com',
    password: process.env.TEST_ADMIN_PASSWORD || 'TestPassword123!',
  },
} as const;

export const TEST_JOB = {
  title: 'E2E Test Job Position',
  description: 'This is a test job created by Playwright E2E tests.',
  locationCity: 'New York',
  locationState: 'NY',
  salaryMin: 80000,
  salaryMax: 120000,
  workSetting: 'hybrid',
  jobType: 'full_time',
  experienceLevel: 'mid',
};

export const TEST_COMPANY = {
  name: 'E2E Test Company',
  website: 'https://example.com',
  industry: 'Technology',
  size: '51-200',
};

/**
 * URLs used across tests
 */
export const ROUTES = {
  home: '/',
  jobs: '/jobs',
  companies: '/companies',
  signin: '/signin',
  signout: '/signout',

  // Candidate routes
  candidateDashboard: '/account/candidate',
  candidateSetup: '/account/candidate/setup',
  candidateProfile: '/account/candidate/profile',
  candidateApplications: '/account/candidate/applications',
  candidateSavedJobs: '/account/candidate/saved',
  candidateResume: '/account/candidate/resume',

  // Employer routes
  employers: '/employers',
  employerDashboard: '/employers/dashboard',
  employerSetup: '/employers/setup',
  employerSettings: '/employers/settings',
  employerTeam: '/employers/team',
  employerBilling: '/employers/billing',
  employerNewJob: '/employers/jobs/new',
  employerCandidates: '/employers/candidates',

  // Admin routes
  admin: '/admin',
  adminCompanies: '/admin/companies',
  adminCandidates: '/admin/candidates',
  adminJobSources: '/admin/job-sources',
  adminHubspot: '/admin/hubspot',
  adminSettings: '/admin/settings',
  adminAiUsage: '/admin/ai-usage',

  // Static pages
  privacy: '/privacy',
  terms: '/terms',
} as const;
