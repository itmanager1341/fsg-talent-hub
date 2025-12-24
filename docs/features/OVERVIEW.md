# FSG Talent Hub - Feature Documentation Overview

## Platform Overview

FSG Talent Hub is a comprehensive job board platform connecting candidates with employers in the financial services industry. The platform includes AI-powered features, resume database access, and comprehensive applicant tracking capabilities.

## Documentation Structure

This documentation is organized by user role to match how users interact with the platform:

- **[Candidate Features](./candidate/)** - For job seekers
- **[Employer Features](./employer/)** - For companies posting jobs
- **[Admin Features](./admin/)** - For platform administrators

## Quick Navigation

### For Candidates

1. **[Dashboard](./candidate/DASHBOARD.md)** - Your central hub
2. **[Profile Management](./candidate/PROFILE.md)** - Update your information
3. **[Resume Builder](./candidate/RESUME.md)** - AI-powered resume optimization
4. **[Job Search](./candidate/JOB_SEARCH.md)** - Find opportunities
5. **[Applications](./candidate/APPLICATIONS.md)** - Track your applications
6. **[Saved Jobs](./candidate/SAVED_JOBS.md)** - Bookmark interesting positions
7. **[Job Recommendations](./candidate/RECOMMENDATIONS.md)** - AI-powered suggestions
8. **[Billing](./candidate/BILLING.md)** - Manage subscription

### For Employers

1. **[Dashboard](./employer/DASHBOARD.md)** - Manage your hiring
2. **[Company Setup](./employer/SETUP.md)** - Get started
3. **[Job Posting](./employer/JOB_POSTING.md)** - Create job listings
4. **[Applicant Management](./employer/APPLICANTS.md)** - Review applications
5. **[Candidate Search](./employer/CANDIDATE_SEARCH.md)** - Find candidates proactively
6. **[AI Features](./employer/AI_FEATURES.md)** - AI-powered tools
7. **[Billing](./employer/BILLING.md)** - Manage subscription
8. **[Team Management](./employer/TEAM.md)** - Collaborate with your team

### For Admins

1. **[Admin Overview](./admin/OVERVIEW.md)** - Admin console guide
2. **[Job Sources](./admin/JOB_SOURCES.md)** - Manage external job imports
3. **[Candidates](./admin/CANDIDATES.md)** - Manage candidate accounts
4. **[Companies](./admin/COMPANIES.md)** - Manage employer companies
5. **[HubSpot Integration](./admin/HUBSPOT.md)** - Sync company data
6. **[AI Usage](./admin/AI_USAGE.md)** - Monitor AI costs and usage
7. **[Settings](./admin/SETTINGS.md)** - Platform configuration

## Platform Features by Category

### AI-Powered Features
- **Job Description Generator** (Employers) - AI creates professional job descriptions
- **Resume Builder** (Candidates) - AI optimizes resumes for ATS compatibility
- **Applicant Ranking** (Employers) - AI scores candidates by job fit
- **Job Recommendations** (Candidates) - AI suggests relevant jobs
- **Candidate Matching** (Employers) - AI matches candidates to jobs

### Job Management
- **Job Posting** - Create and manage job listings
- **Job Search** - Advanced filtering and discovery
- **External Job Import** - Sync jobs from Indeed, Jooble, Adzuna, RSS
- **Job Status Management** - Draft, Active, Paused, Closed, Expired

### Application Management
- **Application Tracking** - Candidates track application status
- **Applicant Review** - Employers review and rank applicants
- **Status Updates** - Real-time status changes
- **Resume Access** - Secure resume downloads

### Candidate Discovery
- **Resume Database** - Employers search qualified candidates
- **Candidate Invitations** - Invite candidates to apply
- **Saved Candidates** - Bookmark candidates for later
- **AI Matching** - Find best-fit candidates

### Subscription & Billing
- **Candidate Tiers**: Free, Premium
- **Employer Tiers**: Free, Starter, Professional, Enterprise
- **Stripe Integration** - Secure payment processing
- **Feature Access** - Tier-based feature availability

## Getting Started

### For Candidates
1. Sign up and create your profile
2. Upload your resume
3. Complete your profile (name, headline, location)
4. Start searching for jobs
5. Apply to positions
6. Track your applications

### For Employers
1. Sign up and set up your company
2. Complete company profile
3. Post your first job
4. Review applications
5. Search candidates (Starter+)
6. Manage your team (Premium+)

### For Admins
1. Access admin console
2. Review companies and candidates
3. Manage job sources
4. Monitor AI usage
5. Configure platform settings

## Feature Availability by Tier

### Candidate Tiers
- **Free**: Profile, resume upload, job search, applications, saved jobs
- **Premium**: Everything in Free + AI resume optimization, cover letters, enhanced recommendations

### Employer Tiers
- **Free**: 1 active job, basic profile, view applications
- **Starter**: 5 jobs, AI JD generator (50/day), resume search
- **Professional**: 25 jobs, AI JD (200/day), AI ranking, featured listings
- **Enterprise**: Unlimited jobs, AI JD (1000/day), full features, API access

## Related Documentation

- [Product Requirements Document](../01_PRD_Job_Board_Platform.md) - Full platform specifications
- [Development Plan](../DEV_PLAN_v3.md) - Implementation roadmap
- [Architecture Documentation](../02_ARCHITECTURE_CLARIFICATION.md) - Technical architecture
- [FAQ Source](./FAQ_SOURCE.md) - Consolidated FAQ content

## Documentation Maintenance

This documentation is maintained alongside the codebase. When features are added or changed:
1. Update the relevant feature document
2. Update this overview if needed
3. Update FAQ_SOURCE.md with new questions
4. Cross-reference with PRD for accuracy

## Support

For questions about features not covered in this documentation:
- Check the [FAQ Source](./FAQ_SOURCE.md)
- Review the specific feature documentation
- Contact support@fsgmedia.com

