# Job Search & Discovery

## Overview
The job search feature allows candidates to browse, filter, and discover job opportunities. It includes advanced filtering, search functionality, and displays job details with application options.

## Access
- **Who**: All users (public)
- **Location**: `/jobs`
- **Requirements**: 
  - No authentication required to browse
  - Authentication required to apply or save jobs

## Current Features

### Job Listing Page
- Grid display of job cards
- Pagination support (12 jobs per page)
- Total job count display
- Responsive design (3 columns on desktop, 2 on tablet, 1 on mobile)

### Advanced Filters
- **Keyword Search** - Search in job titles
- **Location Filter** - Filter by state or "Remote"
- **Work Setting** - On-site, Remote, Hybrid
- **Job Type** - Full-time, Part-time, Contract, Internship, Temporary
- **Experience Level** - Entry, Mid, Senior, Lead, Executive
- Filters persist in URL for sharing

### Job Card Display
Each job card shows:
- Job title
- Company name
- Location (city, state) or work setting
- Job type badge
- Salary range (if shown)
- Posted date
- Link to job details

### Job Details Page
- Full job description
- Requirements section
- Benefits section
- Company information sidebar
- Similar jobs section
- Apply button (or sign-in prompt)
- Save job button (for authenticated candidates)
- External job indicator (if applicable)

### Filter Persistence
- Filters stored in URL query parameters
- Shareable filtered job search URLs
- Browser back/forward navigation support

## How It Works

1. **Job Listing Load**
   - Server fetches active jobs from database
   - Applies filters from URL query parameters
   - Orders by published_at (newest first)
   - Paginates results (12 per page)

2. **Filter Application**
   - User selects filters from sidebar
   - URL updates with filter parameters
   - Page reloads with filtered results
   - Filter state preserved in URL

3. **Job Details View**
   - Fetches full job data including company info
   - Checks if user is authenticated
   - Determines if job is saved (for candidates)
   - Shows appropriate action buttons

4. **External Jobs**
   - Jobs imported from external sources (Indeed, Jooble, etc.)
   - Marked with "External" badge
   - "Apply on Company Site" button links to external URL
   - No internal application flow

5. **Similar Jobs**
   - Uses vector similarity search
   - Finds jobs with similar descriptions
   - Displays up to 5 similar jobs
   - Only for internal jobs

## Technical Details

- **Key components**: 
  - `src/app/jobs/page.tsx` - Job listing page
  - `src/app/jobs/[id]/page.tsx` - Job details page
  - `src/components/jobs/JobCard.tsx` - Job card component
  - `src/components/jobs/JobFilters.tsx` - Filter sidebar
  - `src/components/jobs/SaveJobButton.tsx` - Save/unsave functionality
  - `src/app/jobs/[id]/SimilarJobs.tsx` - Similar jobs component
- **Server actions**: 
  - `src/lib/actions/jobs.ts` - Job-related server actions
- **Database tables**: 
  - `jobs` - Job postings
  - `companies` - Company information
  - `saved_jobs` - Saved job bookmarks
- **Database functions**: Similar jobs uses vector search (if implemented)

## User Roles & Permissions

- **Public (Unauthenticated)**: 
  - Can browse all jobs
  - Can view job details
  - Cannot apply or save jobs
  - Prompted to sign in for actions
- **Candidate (All Tiers)**: 
  - Full access to browse
  - Can apply to jobs
  - Can save jobs
  - Can view similar jobs
- **Employers**: Can browse jobs (view competition)
- **Admins**: Full access

## FAQ Items

**Q: How do I search for remote jobs?**
A: Use the Location filter and select "Remote" or use the Work Setting filter and select "Remote".

**Q: Can I save my search filters?**
A: Currently, filters are saved in the URL, so you can bookmark filtered searches. Future versions may include saved search alerts.

**Q: What's the difference between internal and external jobs?**
A: Internal jobs are posted directly by employers on the platform and you can apply through the site. External jobs are imported from other sources and require applying on the company's website.

**Q: How are similar jobs determined?**
A: Similar jobs use AI-powered vector similarity matching based on job descriptions. Jobs with similar content, requirements, and descriptions are matched.

**Q: Why don't all jobs show salary information?**
A: Employers can choose whether to display salary information. Some jobs may not have salary data, or the employer may have chosen to hide it.

**Q: How often are job listings updated?**
A: Jobs are updated in real-time. New jobs appear as soon as employers post them. External jobs are synced periodically (managed by admins).

## Related Features

- [Applications](./APPLICATIONS.md) - Apply to jobs from search
- [Saved Jobs](./SAVED_JOBS.md) - Save jobs for later
- [Job Recommendations](./RECOMMENDATIONS.md) - AI-powered job suggestions
- [Dashboard](./DASHBOARD.md) - Quick access to job search

## Future Enhancements

- [ ] Saved search alerts (email notifications)
- [ ] Advanced keyword search (description, requirements)
- [ ] Salary range filter
- [ ] Industry/profession filters
- [ ] Job alert preferences
- [ ] Map view for location-based jobs
- [ ] Sort options (relevance, salary, date)
- [ ] Company size filter
- [ ] Application deadline indicators

