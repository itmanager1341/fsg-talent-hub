# Application Tracking

## Overview
The application tracking feature allows candidates to view all their job applications, track their status, and see application history. It provides a centralized view of all job applications with status updates.

## Access
- **Who**: Candidates (authenticated)
- **Location**: `/account/candidate/applications`
- **Requirements**: 
  - User must be authenticated
  - User must have a candidate profile

## Current Features

### Application List
- Displays all applications in reverse chronological order (newest first)
- Shows job title, company name, location
- Application date display
- Status badge with color coding
- Link to view job details

### Application Statuses
Color-coded status badges:
- **Applied** (Blue) - Initial application submitted
- **Viewed** (Purple) - Employer has viewed application
- **Screening** (Yellow) - Under initial review
- **Interviewing** (Orange) - Interview process active
- **Offered** (Green) - Job offer received
- **Hired** (Green) - Successfully hired
- **Not Selected** (Gray) - Application rejected
- **Withdrawn** (Gray) - Candidate withdrew application

### Application Details
Each application card shows:
- Job title (linked to job page)
- Company name
- Location (city, state or work setting)
- Application date (formatted)
- Current status
- Link to view full job posting

### Empty State
- Helpful message when no applications exist
- Call-to-action to browse jobs
- Link to job search page

## How It Works

1. **Page Load**
   - Fetches all applications for the candidate
   - Joins with jobs and companies tables
   - Orders by applied_at (newest first)
   - Displays in card layout

2. **Status Updates**
   - Status is updated by employers when reviewing applications
   - Candidates see status changes in real-time
   - Status history may be tracked (future feature)

3. **Job Links**
   - Each application links to the job details page
   - If job is deleted or closed, shows "Job no longer available"
   - Maintains application record even if job is removed

4. **Application Flow**
   - Candidate applies from job details page
   - Application created with status "applied"
   - Application appears in this list immediately
   - Employer can update status as they review

## Technical Details

- **Key components**: 
  - `src/app/account/candidate/applications/page.tsx` - Applications list page
- **Server actions**: None (data fetched via Supabase query)
- **Database tables**: 
  - `applications` - Application records
  - `jobs` - Job postings (joined)
  - `companies` - Company information (joined)
- **Edge functions**: None

## User Roles & Permissions

- **Candidate (All Tiers)**: 
  - Can view own applications
  - Can see status updates
  - Cannot modify application status (employer-controlled)
- **Employers**: 
  - Can view applications for their jobs
  - Can update application status
  - See applications in employer dashboard
- **Admins**: Can view all applications

## FAQ Items

**Q: How do I know if an employer has viewed my application?**
A: The status will change from "Applied" to "Viewed" when the employer opens your application. This happens automatically.

**Q: Can I withdraw an application?**
A: Currently, application withdrawal is not available through the candidate interface. Contact the employer directly or reach out to support if you need to withdraw.

**Q: What happens if a job is removed after I apply?**
A: Your application record is preserved. The job will show as "Job no longer available" but you can still see when you applied and the status.

**Q: How long does it take for status to update?**
A: Status updates happen in real-time when employers make changes. You may need to refresh the page to see the latest status.

**Q: Can I apply to the same job twice?**
A: No, the system prevents duplicate applications. If you try to apply again, you'll be redirected to a success page indicating you've already applied.

**Q: Will I be notified of status changes?**
A: Email notifications for status changes are planned for a future release. Currently, you need to check the applications page for updates.

## Related Features

- [Job Search](./JOB_SEARCH.md) - Find jobs to apply to
- [Dashboard](./DASHBOARD.md) - Quick view of recent applications
- [Profile Management](./PROFILE.md) - Update profile before applying

## Future Enhancements

- [ ] Email notifications for status changes (V3)
- [ ] Application withdrawal feature
- [ ] Status change history timeline
- [ ] Notes/notes field for candidates
- [ ] Interview scheduling integration (V3)
- [ ] Application analytics (response rate, average time to response)
- [ ] Bulk actions (withdraw multiple)
- [ ] Export applications to CSV
- [ ] Application reminders/follow-ups

