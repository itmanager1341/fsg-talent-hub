# Candidate Profile Management

## Overview
The profile management page allows candidates to update their personal information, upload and manage their resume, and control their visibility to employers. A complete profile increases visibility and improves job matching.

## Access
- **Who**: Candidates (authenticated)
- **Location**: `/account/candidate/profile`
- **Requirements**: 
  - User must be authenticated
  - User must have a candidate profile

## Current Features

### Resume Upload Section
- Upload resume files (PDF, DOC, DOCX)
- View current resume filename
- Replace existing resume
- Resume is stored in Supabase Storage
- Signed URLs used for secure access

### Profile Form Fields
- **First Name** (required for applications)
- **Last Name** (required for applications)
- **Email** (read-only, from auth account)
- **Phone** (optional)
- **Headline** (professional tagline, e.g., "Senior M&A Advisor")
- **City** (optional)
- **State** (optional)
- **Bio/Summary** (optional text area)

### Profile Completion Indicator
- Dashboard shows completion status
- Requires: first name, last name, headline, resume
- Incomplete profiles may limit application functionality

## How It Works

1. **Page Load**
   - Fetches current candidate profile data
   - Loads current resume URL and filename
   - Pre-fills form with existing data

2. **Resume Upload**
   - User selects file from device
   - File uploaded to Supabase Storage bucket
   - File metadata stored in `candidates.resume_url` and `candidates.resume_filename`
   - Old resume replaced if one exists
   - Resume text extracted for AI features (if applicable)

3. **Profile Update**
   - Form submission updates candidate record
   - Server action validates and saves changes
   - Success message displayed
   - Redirects back to dashboard or specified next URL

4. **Profile Validation**
   - First and last name required for job applications
   - Other fields optional
   - Profile can be saved partially

## Technical Details

- **Key components**: 
  - `src/app/account/candidate/profile/page.tsx` - Main profile page
  - `src/app/account/candidate/profile/ProfileForm.tsx` - Profile form component
  - `src/app/account/candidate/profile/ResumeUpload.tsx` - Resume upload component
- **Server actions**: 
  - `src/app/account/candidate/profile/actions.ts` - Update profile, upload resume
- **Database tables**: 
  - `candidates` - Stores profile data
  - `storage.resumes` - Supabase Storage bucket for resume files
- **Edge functions**: None

## User Roles & Permissions

- **Candidate (All Tiers)**: Can update own profile
- **Employers**: Can view profile if candidate is searchable (resume database)
- **Admins**: Full access to all candidate profiles

## FAQ Items

**Q: What file formats are supported for resumes?**
A: PDF, DOC, and DOCX files are supported. PDF is recommended for best compatibility.

**Q: Can I upload multiple resumes?**
A: Currently, you can only have one active resume. Uploading a new resume replaces the previous one. Future versions may support multiple resume versions.

**Q: Who can see my profile?**
A: Your profile visibility is controlled by the `is_searchable` flag. If enabled, employers with access to the resume database can see your profile. You can control this in your account settings (future feature).

**Q: Do I need to complete my profile to apply for jobs?**
A: You need at least your first and last name to apply. However, a complete profile (including resume and headline) significantly improves your chances and enables AI job recommendations.

**Q: How do I update my email address?**
A: Email is managed through your authentication account. You'll need to update it in your account settings or contact support.

## Related Features

- [Dashboard](./DASHBOARD.md) - View profile completion status
- [Resume Builder](./RESUME.md) - AI-powered resume optimization
- [Job Search](./JOB_SEARCH.md) - Profile affects job matching

## Future Enhancements

- [ ] Multiple resume versions support
- [ ] Profile visibility controls (public/private/hidden)
- [ ] Skills and certifications fields
- [ ] Portfolio/website links
- [ ] Social media profile integration
- [ ] Profile completion progress bar with tips

