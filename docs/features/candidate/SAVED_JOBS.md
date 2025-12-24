# Saved Jobs

## Overview
The saved jobs feature allows candidates to bookmark jobs they're interested in for later review. This helps candidates organize their job search and easily return to positions they want to consider.

## Access
- **Who**: Candidates (authenticated)
- **Location**: `/account/candidate/saved`
- **Requirements**: 
  - User must be authenticated
  - User must have a candidate profile

## Current Features

### Saved Jobs List
- Displays all saved jobs in reverse chronological order (newest first)
- Shows job title, company name
- Location information (city, state or work setting)
- Job type and work setting badges
- Date saved
- Quick apply button
- Remove from saved button

### Job Information Display
Each saved job card shows:
- Job title (linked to job details)
- Company name
- Location badges (city/state or remote indicator)
- Work setting badge (On-site, Remote, Hybrid)
- Job type badge (Full-time, Part-time, etc.)
- Date when job was saved
- Quick action buttons

### Quick Actions
- **Apply** - Direct link to application page
- **Remove** - Unsave the job from saved list
- **View Job** - Link to full job details page

### Empty State
- Helpful message when no jobs are saved
- Call-to-action to browse jobs
- Link to job search page

## How It Works

1. **Saving a Job**
   - From job details page, click "Save Job" button
   - Creates record in `saved_jobs` table
   - Button changes to "Unsave" state
   - Job appears in saved jobs list

2. **Viewing Saved Jobs**
   - Page loads all saved jobs for candidate
   - Joins with jobs and companies tables
   - Filters out deleted/closed jobs (shows "Job no longer available")
   - Displays in card layout

3. **Removing Saved Jobs**
   - Click "Remove" button on saved job card
   - Server action deletes saved_jobs record
   - Job removed from list immediately
   - Can be saved again from job details page

4. **Applying from Saved Jobs**
   - Click "Apply" button on saved job card
   - Redirects to application page
   - Job remains saved after application
   - Can unsave after applying if desired

## Technical Details

- **Key components**: 
  - `src/app/account/candidate/saved/page.tsx` - Saved jobs list page
  - `src/components/jobs/SaveJobButton.tsx` - Save/unsave button component
  - `src/app/account/candidate/saved/RemoveSavedJobButton.tsx` - Remove button
- **Server actions**: 
  - `src/app/account/candidate/saved/actions.ts` - Save, unsave, remove operations
- **Database tables**: 
  - `saved_jobs` - Saved job bookmarks (candidate_id, job_id, created_at)
  - `jobs` - Job postings (joined)
  - `companies` - Company information (joined)

## User Roles & Permissions

- **Candidate (All Tiers)**: 
  - Can save unlimited jobs
  - Can view own saved jobs
  - Can remove saved jobs
- **Employers**: Cannot see which candidates saved their jobs
- **Admins**: Can view saved jobs data for analytics

## FAQ Items

**Q: How many jobs can I save?**
A: There's no limit on the number of jobs you can save. Save as many as you'd like for later review.

**Q: Will I be notified if a saved job is about to expire?**
A: Job expiration notifications are planned for a future release. Currently, you'll need to check saved jobs periodically.

**Q: What happens if a saved job is removed by the employer?**
A: The job will show as "Job no longer available" in your saved list. You can remove it from your saved jobs to clean up the list.

**Q: Can I organize saved jobs into folders or categories?**
A: Currently, all saved jobs are in one list. Folder/category organization is planned for a future release.

**Q: Do saved jobs expire?**
A: Saved jobs don't expire, but the underlying job posting may be closed or removed by the employer. The saved record remains until you remove it.

**Q: Can I share my saved jobs list?**
A: Currently, saved jobs are private. Sharing functionality is not available.

## Related Features

- [Job Search](./JOB_SEARCH.md) - Find and save jobs
- [Applications](./APPLICATIONS.md) - Apply to saved jobs
- [Dashboard](./DASHBOARD.md) - Quick view of recent saved jobs

## Future Enhancements

- [ ] Job expiration alerts for saved jobs
- [ ] Organize saved jobs into folders/categories
- [ ] Notes field for each saved job
- [ ] Sort options (date saved, job title, company)
- [ ] Filter saved jobs (by location, type, etc.)
- [ ] Share saved jobs list (optional feature)
- [ ] Bulk actions (remove multiple, apply to multiple)
- [ ] Integration with job alerts

