# Employer Dashboard

## Overview
The employer dashboard is the central hub for employers to manage their job postings, view applications, access analytics, and navigate to key features. It provides an overview of hiring activity and quick access to all employer tools.

## Access
- **Who**: Employers (authenticated)
- **Location**: `/employers/dashboard`
- **Requirements**: 
  - User must be authenticated
  - User must be associated with a company (via `company_users` table)
  - Company must be set up

## Current Features

### Header Section
- Company name display
- User email
- "Post a Job" quick action button
- Sign out button

### Statistics Cards
Four key metrics displayed:
1. **Active Jobs** - Count of currently active job postings
2. **Total Jobs** - All jobs ever posted (all statuses)
3. **Total Applications** - Sum of all applications across all jobs
4. **Total Views** - Sum of all job view counts

### Resume Database CTA
- Prominent call-to-action card
- Free tier: Shows "Upgrade to Access" button
- Paid tiers: Shows "Search Candidates" button
- Links to candidate search or billing page

### Jobs List Section
- Displays all company jobs
- Shows job title, status, view count, application count
- Status badges (Draft, Active, Paused, Closed, Expired)
- Quick actions:
  - "View Applicants" (if applications exist)
  - "Edit" job
- Link to post new job
- Empty state with call-to-action

### Recent Applications Widget
- Shows last 5 applications across all jobs
- Displays candidate name, job title
- Application date
- Link to view full application details
- Empty state message

### Company Settings Quick Links
- Edit Company Profile
- Manage Team
- Billing & Subscription
- Current plan display

## How It Works

1. **Page Load**
   - Server fetches company data using `requireEmployer()` auth check
   - Loads all company jobs
   - Loads recent applications (last 5)
   - Calculates statistics from job data
   - Checks company tier for feature access

2. **Statistics Calculation**
   - Active jobs: Filters jobs with status = 'active'
   - Total jobs: Count of all jobs
   - Total applications: Sum of `apply_count` from all jobs
   - Total views: Sum of `view_count` from all jobs

3. **Resume Database Access**
   - Checks company tier
   - Free tier: Shows upgrade CTA
   - Paid tiers (starter+): Shows access button
   - Links to appropriate destination

4. **Job Status Display**
   - Color-coded status badges
   - Status determines job visibility and functionality
   - Only active jobs appear in public job search

## Technical Details

- **Key components**: 
  - `src/app/employers/dashboard/page.tsx` - Main dashboard page
- **Server actions**: None (all data fetched via Supabase queries)
- **Database tables**: 
  - `companies` - Company information
  - `company_users` - Links users to companies
  - `jobs` - Job postings
  - `applications` - Application records
- **Database functions**: None

## User Roles & Permissions

- **Employer (All Tiers)**: 
  - Can view dashboard
  - Access varies by tier:
    - Free: 1 active job, basic features
    - Starter: 5 active jobs, AI JD generator
    - Professional: 25 active jobs, resume search
    - Enterprise: Unlimited jobs, full features
- **Team Members**: 
  - Recruiters: Can view dashboard, manage jobs
  - Viewers: Read-only access
- **Admins**: Can view all employer dashboards

## FAQ Items

**Q: Why can't I access the Resume Database?**
A: Resume database access requires a paid subscription (Starter tier or higher). Free tier employers can upgrade from the billing page.

**Q: How do I post a new job?**
A: Click the "Post a Job" button in the header or the "Post New Job" link in the jobs section. You'll be taken to the job creation form.

**Q: What's the difference between job statuses?**
A: 
- **Draft**: Not published, not visible to candidates
- **Active**: Published and visible in job search
- **Paused**: Temporarily hidden from search
- **Closed**: No longer accepting applications
- **Expired**: Past expiration date

**Q: How do I see all applications for a job?**
A: Click "View Applicants" next to any job with applications, or click on the job title to go to the job details page, then navigate to applications.

**Q: Can I see analytics for my jobs?**
A: Basic analytics (views, applications) are shown on the dashboard. Advanced analytics are available for Professional and Enterprise tiers.

## Related Features

- [Job Posting](./JOB_POSTING.md) - Create and manage jobs
- [Applicants](./APPLICANTS.md) - Review applications
- [Candidate Search](./CANDIDATE_SEARCH.md) - Resume database
- [Billing](./BILLING.md) - Manage subscription
- [Team Management](./TEAM.md) - Manage team members

## Future Enhancements

- [ ] Advanced analytics dashboard
- [ ] Time-to-hire metrics
- [ ] Source performance tracking
- [ ] Application funnel visualization
- [ ] Custom date range filtering
- [ ] Export data to CSV
- [ ] Job performance comparisons
- [ ] Candidate pipeline visualization (V3)

