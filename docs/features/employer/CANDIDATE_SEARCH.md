# Resume Database / Candidate Search

## Overview
The resume database allows employers to search and discover qualified candidates proactively. It provides advanced search filters, AI-powered matching, and the ability to invite candidates to apply for specific jobs.

## Access
- **Who**: Employers (Starter tier and above)
- **Location**: `/employers/candidates`
- **Requirements**: 
  - User must be authenticated employer
  - Company must have Starter tier or higher
  - Free tier users redirected to billing page

## Current Features

### Candidate Search Interface
- Keyword search across resume content
- Location filter (by state)
- Experience level filter
- Work preference filter (remote, on-site, hybrid)
- Real-time search results
- Pagination support

### Candidate Profiles
Each candidate card displays:
- Name and headline
- Location (city, state)
- Experience level
- Work preferences
- Resume preview/summary
- AI match score (if searching for specific job)
- Quick actions

### AI Job Matching
- Select a job from dropdown
- AI calculates match score for each candidate
- Candidates sorted by match score
- Match reasons displayed
- Helps find best-fit candidates for specific roles

### Candidate Actions
- **View Full Profile** - See complete candidate information
- **View Resume** - Download or view resume
- **Invite to Apply** - Send invitation to apply for a job
- **Save Candidate** - Bookmark for later review

### Saved Candidates
- View saved candidates separately
- Access from main candidate search page
- Remove from saved list
- Quick access to saved profiles

### Search Filters
- **Keyword** - Search in resume text, headline, skills
- **Location** - Filter by state
- **Experience Level** - Entry, Mid, Senior, Lead, Executive
- **Work Setting** - Remote, On-site, Hybrid preferences
- **Active Status** - Only active candidates shown
- **Searchable** - Only candidates who opted into search

## How It Works

1. **Page Load**
   - Checks company tier (requires Starter+)
   - Loads available states for filter dropdown
   - Loads company's active jobs for AI matching
   - Displays search interface

2. **Candidate Search**
   - User enters search criteria
   - Query searches `candidates` table
   - Filters by:
     - `is_active = true`
     - `is_searchable = true`
     - Location, experience, work preferences
   - Results displayed in grid

3. **AI Job Matching**
   - User selects a job from dropdown
   - For each candidate:
     - Candidate resume embedding compared to job embedding
     - Match score calculated (0-100)
     - Match reasons generated
   - Results sorted by match score
   - Top matches highlighted

4. **Invite to Apply**
   - User selects candidate and job
   - Invitation created in `candidate_invitations` table
   - Candidate receives notification (dashboard)
   - Invitation includes personalized message

5. **Save Candidate**
   - Candidate added to saved list
   - Stored in `saved_candidates` table
   - Accessible from saved candidates page
   - Can be removed later

## Technical Details

- **Key components**: 
  - `src/app/employers/candidates/page.tsx` - Candidate search page
  - `src/app/employers/candidates/CandidateSearch.tsx` - Search component
  - `src/app/employers/candidates/saved/page.tsx` - Saved candidates page
- **Server actions**: 
  - `src/app/employers/candidates/actions.ts` - Search, invite, save candidates
- **Database tables**: 
  - `candidates` - Candidate profiles
  - `candidate_invitations` - Invitations sent
  - `saved_candidates` - Saved candidate bookmarks
  - `jobs` - For AI matching
- **Edge functions**: 
  - AI candidate matching (vector similarity)
- **Vector search**: Uses pgvector for similarity matching

## User Roles & Permissions

- **Employer (Starter+)**: 
  - Can search candidates
  - Can view candidate profiles
  - Can invite candidates
  - Can save candidates
  - Can use AI matching
- **Employer (Free)**: 
  - Cannot access resume database
  - Redirected to upgrade page
- **Candidates**: 
  - Can control searchability (`is_searchable` flag)
  - Can see invitations received
- **Admins**: Can view all candidates and search activity

## FAQ Items

**Q: Why can't I access the resume database?**
A: Resume database access requires a Starter tier subscription or higher. Free tier employers can upgrade from the billing page.

**Q: How do I find candidates for a specific job?**
A: Use the AI job matching feature. Select your job from the dropdown, and candidates will be ranked by how well they match the job requirements.

**Q: Can candidates see that I viewed their profile?**
A: Currently, profile views are not tracked or visible to candidates. This may be added as a feature in the future.

**Q: How do candidate invitations work?**
A: When you invite a candidate, they receive a notification on their dashboard. They can view the job and choose to apply. Invitations include a personalized message.

**Q: Can I search for candidates by skills?**
A: Keyword search searches across resume content, which includes skills. For best results, use specific skill terms in your search.

**Q: How many candidates can I save?**
A: There's no limit on the number of candidates you can save. Save as many as you need for later review.

**Q: Are all candidates searchable?**
A: Only candidates who have opted into search (`is_searchable = true`) appear in results. Candidates can control their visibility in their account settings.

**Q: How accurate is the AI matching?**
A: AI matching uses vector similarity to compare candidate resumes with job descriptions. Higher scores (80+) indicate strong matches, but you should still review candidates manually.

## Related Features

- [Dashboard](./DASHBOARD.md) - Quick access to candidate search
- [Job Posting](./JOB_POSTING.md) - Jobs for AI matching
- [Applicants](./APPLICANTS.md) - Manage applications
- [Billing](./BILLING.md) - Upgrade for access

## Future Enhancements

- [ ] Advanced filters (skills, education, certifications)
- [ ] Candidate profile views tracking
- [ ] Bulk invite to multiple candidates
- [ ] Candidate comparison tool
- [ ] Saved search alerts
- [ ] Candidate notes/ratings
- [ ] Integration with applicant tracking
- [ ] Export candidate lists
- [ ] Candidate activity tracking
- [ ] Skills-based search
- [ ] Education level filter
- [ ] Salary expectations filter

