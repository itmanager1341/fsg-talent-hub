# Applicant Management

## Overview
The applicant management feature allows employers to view, filter, sort, and manage applications for their job postings. It includes AI-powered applicant ranking for premium tiers.

## Access
- **Who**: Employers (authenticated)
- **Location**: `/employers/jobs/[id]/applications`
- **Requirements**: 
  - User must be authenticated employer
  - User must have access to the job (company member)
  - Job must exist

## Current Features

### Application List
- Displays all applications for a job
- Shows candidate name, email, phone
- Application date
- Cover letter (if provided)
- Resume download link
- AI match score (if ranked)
- Application status

### Status Filtering
Filter applications by status:
- **All** - All applications
- **New** - Status = 'applied'
- **Screening** - Under review
- **Interviewing** - Interview process
- **Offered** - Job offer extended
- **Rejected** - Not selected

### Sorting Options
- **Recent** - By application date (newest first)
- **AI Score** - By AI match score (highest first, Premium tier)

### AI Applicant Ranking (Premium Tier)
- Bulk rank all unranked applications
- Individual application ranking
- Match score (0-100)
- Match reasons/explanation
- Helps prioritize top candidates

### Application Status Management
- Update application status
- Status options:
  - Applied
  - Viewed
  - Screening
  - Interviewing
  - Offered
  - Hired
  - Rejected
  - Withdrawn

### Application Details
Each application card shows:
- Candidate name and contact info
- Resume download (signed URL)
- Cover letter (if provided)
- Application date
- Current status
- AI match score and reasons (if ranked)
- Status update controls

### Bulk Actions
- Bulk rank unranked applications (Premium)
- Status counts displayed in filter tabs
- Quick status updates

## How It Works

1. **Page Load**
   - Fetches job details
   - Loads all applications for the job
   - Checks company tier for AI ranking access
   - Applies filters and sorting

2. **Status Filtering**
   - User selects status tab
   - Applications filtered by status
   - Count displayed in tab
   - URL updates with filter parameter

3. **AI Ranking (Premium)**
   - User clicks "Rank Applicants" button
   - For each unranked application:
     - Candidate resume compared to job description
     - AI calculates match score
     - Match reasons generated
   - Results stored in application record
   - Applications sorted by score

4. **Status Updates**
   - User selects new status from dropdown
   - Status updated in database
   - Application card updates immediately
   - Status change may trigger notifications (future)

5. **Resume Viewing**
   - Resume stored in Supabase Storage
   - Signed URL generated for secure access
   - URL expires after set time
   - Download or view in browser

## Technical Details

- **Key components**: 
  - `src/app/employers/jobs/[id]/applications/page.tsx` - Applications page
  - `src/app/employers/jobs/[id]/applications/ApplicationCard.tsx` - Application card
  - `src/app/employers/jobs/[id]/applications/BulkRankButton.tsx` - Bulk ranking
- **Server actions**: 
  - `src/app/employers/jobs/[id]/applications/actions.ts` - Update status, rank applicants
- **Database tables**: 
  - `applications` - Application records
  - `candidates` - Candidate information
  - `jobs` - Job postings
- **Edge functions**: 
  - AI applicant ranking (calls OpenRouter API)
- **Rate limiting**: AI ranking limited by tier

## User Roles & Permissions

- **Employer (Owner/Recruiter)**: 
  - Can view all applications
  - Can update application status
  - Can use AI ranking (Premium tier)
  - Can download resumes
- **Employer (Viewer)**: 
  - Can view applications
  - Cannot update status
  - Cannot use AI ranking
- **Admins**: Can view all applications

## FAQ Items

**Q: How does AI applicant ranking work?**
A: The AI compares each candidate's resume to the job description and requirements, calculating a match score (0-100) and providing reasons for the score. Available for Professional and Enterprise tiers.

**Q: Can I rank applications individually?**
A: Yes, you can rank individual applications from the application card. Bulk ranking ranks all unranked applications at once.

**Q: What happens when I update an application status?**
A: The status is updated immediately and the candidate can see the change in their application tracking. Email notifications are planned for future release.

**Q: Can I download all resumes at once?**
A: Currently, resumes must be downloaded individually. Bulk download may be added in a future release.

**Q: How long are resume download links valid?**
A: Signed URLs expire after a set time period (typically 1 hour) for security. You can generate a new link by refreshing the page.

**Q: Can I see application history or notes?**
A: Application status history and notes are planned for V3. Currently, only the current status is visible.

**Q: What if a candidate withdraws their application?**
A: The status will be updated to "Withdrawn" and the application will remain in the list but filtered out of active consideration.

## Related Features

- [Dashboard](./DASHBOARD.md) - Quick view of recent applications
- [Job Posting](./JOB_POSTING.md) - Manage the job posting
- [AI Features](./AI_FEATURES.md) - AI ranking details
- [Candidate Search](./CANDIDATE_SEARCH.md) - Find candidates proactively

## Future Enhancements

- [ ] Email notifications for status changes
- [ ] Application notes/comments
- [ ] Status change history timeline
- [ ] Bulk status updates
- [ ] Resume comparison view
- [ ] Interview scheduling integration (V3)
- [ ] Messaging with candidates (V3)
- [ ] Application pipeline/kanban view (V3)
- [ ] Export applications to CSV
- [ ] Application analytics
- [ ] Custom status options
- [ ] Application tags/labels

