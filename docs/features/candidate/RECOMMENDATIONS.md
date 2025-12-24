# AI Job Recommendations

## Overview
The AI job recommendations feature uses vector similarity matching to suggest jobs that align with a candidate's profile and resume. It provides personalized job suggestions based on AI analysis of job descriptions and candidate qualifications.

## Access
- **Who**: Candidates (authenticated with resume)
- **Location**: Displayed on candidate dashboard
- **Requirements**: 
  - User must be authenticated
  - User must have a candidate profile
  - Resume must be uploaded and processed (embedding generated)

## Current Features

### Recommendation Display
- Shows up to 5 recommended jobs
- Displays on candidate dashboard
- Match percentage indicator (0-100%)
- Job title, company name, location
- Direct link to job details page
- "Browse all" link to job search

### Match Scoring
- AI calculates similarity score between:
  - Candidate resume/profile embedding
  - Job description embedding
- Score displayed as percentage
- Higher scores indicate better matches
- Based on vector cosine similarity

### Smart Filtering
- Only shows active jobs
- Filters out jobs candidate already applied to
- Prioritizes recent job postings
- Considers job requirements vs candidate qualifications

## How It Works

1. **Embedding Generation**
   - When resume is uploaded, text is extracted
   - Resume text is converted to embedding vector (pgvector)
   - Embedding stored in `candidates.embedding` column
   - Process happens asynchronously

2. **Recommendation Calculation**
   - Database function `get_job_recommendations` called
   - Uses vector similarity search (cosine distance)
   - Compares candidate embedding with job embeddings
   - Returns top matches with similarity scores

3. **Job Details Enrichment**
   - Recommendation IDs used to fetch full job details
   - Company information joined
   - Location and work setting formatted
   - Results displayed in recommendation cards

4. **Display Logic**
   - Recommendations only show if:
     - Candidate has embedding
     - At least one match found
     - Jobs are active
   - Hidden if no recommendations available

## Technical Details

- **Key components**: 
  - `src/app/account/candidate/JobRecommendations.tsx` - Recommendations component
  - `src/app/account/candidate/page.tsx` - Dashboard (displays recommendations)
- **Server actions**: None (data fetched via Supabase RPC)
- **Database tables**: 
  - `candidates` - Stores candidate embedding
  - `jobs` - Stores job embeddings
  - `applications` - Used to filter out applied jobs
- **Database functions**: 
  - `get_job_recommendations(target_candidate_id, match_count)` - Vector similarity search
- **Vector search**: Uses pgvector extension for similarity matching

## User Roles & Permissions

- **Candidate (All Tiers)**: 
  - Free tier: Basic recommendations
  - Premium tier: Enhanced recommendations with priority matching
- **Employers**: Cannot see candidate recommendations
- **Admins**: Can view recommendation analytics

## FAQ Items

**Q: Why don't I see any recommendations?**
A: Recommendations require a resume to be uploaded. Once your resume is processed and an embedding is generated, recommendations will appear. This may take a few minutes after upload.

**Q: How accurate are the recommendations?**
A: Recommendations use AI-powered vector similarity matching. They're based on your resume content and job descriptions. Higher match percentages indicate better alignment.

**Q: Can I improve my recommendations?**
A: Yes! Keep your resume updated, add relevant skills and experience, and use the AI resume builder to optimize your resume content.

**Q: Do recommendations update automatically?**
A: Recommendations are recalculated when you view the dashboard. New jobs are included as they're posted, and your recommendations may change as your profile is updated.

**Q: Will I see jobs I've already applied to?**
A: No, the system filters out jobs you've already applied to from recommendations.

**Q: What's the difference between Free and Premium recommendations?**
A: Premium users get enhanced recommendations with better matching algorithms and priority consideration. Free users get basic recommendations based on resume similarity.

## Related Features

- [Dashboard](./DASHBOARD.md) - Recommendations displayed here
- [Resume Builder](./RESUME.md) - Optimize resume to improve recommendations
- [Profile Management](./PROFILE.md) - Complete profile for better matching
- [Job Search](./JOB_SEARCH.md) - Browse all jobs if recommendations aren't enough
- [Billing](./BILLING.md) - Upgrade to Premium for enhanced recommendations

## Future Enhancements

- [ ] Job alert emails based on recommendations
- [ ] Industry-specific recommendation tuning
- [ ] Salary range preferences in matching
- [ ] Location preferences in matching
- [ ] "Not interested" feedback to improve recommendations
- [ ] Recommendation explanation (why this job matches)
- [ ] Saved recommendation searches
- [ ] Comparison view (side-by-side job comparison)

