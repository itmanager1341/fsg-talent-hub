# Candidate Dashboard

## Overview
The candidate dashboard is the central hub where candidates can view their profile status, recent applications, saved jobs, job recommendations, and job invitations. It provides quick access to all key candidate features.

## Access
- **Who**: Candidates (authenticated)
- **Location**: `/account/candidate`
- **Requirements**: 
  - User must be authenticated
  - User must have a candidate profile (created during signup or setup)

## Current Features

### Profile Completion Alert
- Displays a warning banner if profile is incomplete
- Checks for: first name, last name, headline, and resume upload
- Provides quick link to edit profile

### Job Invitations Section
- Shows job invitations from employers
- Displays up to 10 most recent invitations
- Shows job title, company name, and invitation message
- Links to view full invitation details

### Quick Actions Grid
Six quick action cards providing access to:
1. **Find Jobs** - Browse all available job postings
2. **Edit Profile** - Update candidate profile information
3. **Resume Builder** - AI-powered resume optimization
4. **Applications** - Track all job applications
5. **Saved Jobs** - View bookmarked jobs
6. **Upgrade** - Access billing and premium features

### Recent Applications Widget
- Displays last 5 applications
- Shows job title, company name, application date
- Color-coded status badges (Applied, Viewed, Screening, Interviewing, Offered, Hired, Rejected, Withdrawn)
- Link to view all applications

### Saved Jobs Widget
- Displays last 5 saved jobs
- Shows job title, company name, location, work setting
- Link to view all saved jobs

### Job Recommendations
- AI-powered job recommendations based on candidate profile and resume
- Uses vector similarity matching (pgvector)
- Displays match percentage for each recommendation
- Only shows if candidate has resume uploaded and embedding generated
- Shows up to 5 recommendations

### Profile Summary Card
- Displays current profile information:
  - Full name
  - Headline (if set)
  - Location (city, state)
  - Resume upload status
- Quick link to edit profile

## How It Works

1. **Page Load**
   - Server fetches candidate data using `requireCandidate()` auth check
   - Loads recent applications (last 5)
   - Loads saved jobs (last 5)
   - Checks profile completion status
   - Suspense boundaries handle async loading of recommendations and invitations

2. **Profile Completion Check**
   - Validates: first_name, last_name, headline, resume_url
   - Shows yellow alert banner if incomplete
   - Provides direct link to profile editor

3. **Job Recommendations**
   - Checks if candidate has embedding vector
   - Calls `get_job_recommendations` database function
   - Returns top 5 matching jobs with similarity scores
   - Only displays if recommendations exist

4. **Navigation**
   - All widgets and cards link to their respective detail pages
   - Consistent back navigation throughout

## Technical Details

- **Key components**: 
  - `src/app/account/candidate/page.tsx` - Main dashboard page
  - `src/app/account/candidate/JobRecommendations.tsx` - Recommendations component
  - `src/app/account/candidate/JobInvitationsSection.tsx` - Invitations component
- **Server actions**: None (all data fetched via Supabase queries)
- **Database tables**: 
  - `candidates` - Candidate profile data
  - `applications` - Application records
  - `saved_jobs` - Saved job bookmarks
  - `candidate_invitations` - Employer invitations
  - `jobs` - Job postings (for recommendations)
- **Database functions**: `get_job_recommendations` - Vector similarity search

## User Roles & Permissions

- **Candidate (All Tiers)**: Full access to dashboard
- **No Authentication**: Redirected to sign-in page

## FAQ Items

**Q: Why don't I see job recommendations?**
A: Job recommendations require a resume to be uploaded. Once your resume is processed and an embedding is generated, recommendations will appear.

**Q: How do I complete my profile?**
A: Click "Edit Profile" from the dashboard or the profile completion alert. You need to add your name, headline, and upload a resume.

**Q: Can I see more than 5 recent applications?**
A: Yes, click "View all" in the Recent Applications widget to see your complete application history.

**Q: How do job invitations work?**
A: Employers can invite you to apply for specific jobs. Invitations appear at the top of your dashboard and include a personalized message from the employer.

## Related Features

- [Profile Management](./PROFILE.md)
- [Job Search](./JOB_SEARCH.md)
- [Applications](./APPLICATIONS.md)
- [Saved Jobs](./SAVED_JOBS.md)
- [Job Recommendations](./RECOMMENDATIONS.md)

## Future Enhancements

- [ ] Dashboard customization options
- [ ] Activity feed with recent platform activity
- [ ] Quick stats (applications sent this month, response rate)
- [ ] Personalized tips and suggestions
- [ ] Integration with calendar for interview scheduling (V3)

