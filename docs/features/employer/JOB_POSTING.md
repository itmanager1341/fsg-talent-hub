# Job Posting

## Overview
The job posting feature allows employers to create, edit, and manage job postings. It includes an AI-powered job description generator and comprehensive job details management.

## Access
- **Who**: Employers (authenticated)
- **Location**: 
  - Create: `/employers/jobs/new`
  - Edit: `/employers/jobs/[id]/edit`
- **Requirements**: 
  - User must be authenticated employer
  - Company must be set up
  - Must have available job slots (tier-dependent)

## Current Features

### Job Creation Form
- **Job Title** (required) - Position title
- **Job Description** (required) - Full job description
- **Requirements** (optional) - Required qualifications
- **Benefits** (optional) - Compensation and benefits
- **Department** (optional) - Department/division
- **Job Type** (required) - Full-time, Part-time, Contract, Internship, Temporary
- **Experience Level** (optional) - Entry, Mid, Senior, Lead, Executive
- **Work Setting** (required) - On-site, Remote, Hybrid
- **Location** (optional) - City and state
- **Salary Range** (optional) - Min and max salary
- **Show Salary** (checkbox) - Whether to display salary publicly

### AI Job Description Generator
- Available for Starter tier and above
- Generates job description from:
  - Job title
  - Company name
  - Basic requirements
- Uses OpenRouter API (Claude model)
- Rate-limited per tier
- Cached responses to reduce costs
- Can regenerate or edit generated content

### Job Status Management
- **Draft** - Not published, not visible
- **Active** - Published and visible in job search
- **Paused** - Temporarily hidden
- **Closed** - No longer accepting applications
- **Expired** - Past expiration date

### Job Editing
- Edit all job fields
- Update status
- View application count
- View view count
- Delete job (with confirmation)

### Job Limits by Tier
- **Free**: 1 active job
- **Starter**: 5 active jobs
- **Professional**: 25 active jobs
- **Enterprise**: Unlimited active jobs

## How It Works

1. **Job Creation**
   - User fills out job form
   - Optional: Use AI to generate description
   - Form validation
   - Job created with status 'draft'
   - User can publish immediately or save as draft

2. **AI Description Generation**
   - User clicks "Generate with AI" button
   - Form data sent to Edge Function
   - Edge Function calls OpenRouter API
   - Response cached for future use
   - Generated text inserted into description field
   - User can edit generated content

3. **Job Publishing**
   - Job status changed to 'active'
   - Job appears in public job search
   - Published timestamp recorded
   - View and application counts initialized

4. **Job Editing**
   - All fields can be updated
   - Status can be changed
   - Changes saved immediately
   - Job remains active unless status changed

5. **Job Deletion**
   - Jobs can be deleted
   - Applications are preserved (orphaned)
   - Deletion is permanent

## Technical Details

- **Key components**: 
  - `src/app/employers/jobs/new/page.tsx` - Create job page
  - `src/app/employers/jobs/[id]/edit/page.tsx` - Edit job page
  - `src/app/employers/jobs/_components/JobForm.tsx` - Job form component
  - `src/app/employers/jobs/[id]/edit/JobStatusControls.tsx` - Status controls
- **Server actions**: 
  - `src/app/employers/jobs/actions.ts` - Create, update, delete jobs
- **Database tables**: 
  - `jobs` - Job postings
  - `companies` - Company information
- **Edge functions**: 
  - Job description generation (calls OpenRouter API)
- **Rate limiting**: AI generation limited by tier

## User Roles & Permissions

- **Employer (Owner/Recruiter)**: 
  - Can create jobs (within tier limits)
  - Can edit own company's jobs
  - Can delete jobs
  - Can use AI generator (tier-dependent)
- **Employer (Viewer)**: 
  - Read-only access to jobs
  - Cannot create or edit
- **Admins**: Can create/edit any job

## FAQ Items

**Q: How many jobs can I post?**
A: It depends on your subscription tier. Free tier allows 1 active job, Starter allows 5, Professional allows 25, and Enterprise allows unlimited.

**Q: Can I save a job as a draft?**
A: Yes, create the job and leave it in "Draft" status. You can publish it later when ready.

**Q: How does the AI job description generator work?**
A: Provide a job title, company name, and basic requirements. The AI generates a professional job description that you can edit. Available for Starter tier and above.

**Q: Can I edit a job after it's published?**
A: Yes, you can edit any field of an active job. Changes are saved immediately and reflected in the job listing.

**Q: What happens to applications if I delete a job?**
A: Applications are preserved in the system, but the job link will show as "Job no longer available." You can still view and manage those applications.

**Q: How long do jobs stay active?**
A: Jobs remain active until you change the status to Closed, Paused, or Expired, or until you delete them. There's no automatic expiration (unless you set an expiration date).

**Q: Can I repost a closed job?**
A: Yes, change the status from "Closed" back to "Active" to repost the job.

## Related Features

- [Dashboard](./DASHBOARD.md) - View all jobs
- [Applicants](./APPLICANTS.md) - Manage applications for jobs
- [AI Features](./AI_FEATURES.md) - AI job description generator details
- [Billing](./BILLING.md) - Upgrade to post more jobs

## Future Enhancements

- [ ] Job templates for common positions
- [ ] Bulk job posting
- [ ] Job expiration dates with auto-close
- [ ] Job scheduling (publish at future date)
- [ ] Job duplication/cloning
- [ ] A/B testing for job descriptions
- [ ] Job performance analytics
- [ ] Integration with external job boards
- [ ] Job posting wizard/step-by-step guide

