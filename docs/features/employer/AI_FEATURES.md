# AI-Powered Features for Employers

## Overview
The platform includes several AI-powered features to help employers streamline their hiring process, from generating job descriptions to ranking applicants. These features use OpenRouter API with Claude models.

## Access
- **Who**: Employers (tier-dependent)
- **Location**: Various (job posting, applicant management)
- **Requirements**: 
  - Varies by feature
  - Some features require paid tiers
  - Rate limits apply per tier

## Current Features

### AI Job Description Generator
- **Location**: Job posting form
- **Tiers**: Starter, Professional, Enterprise
- **How it works**:
  - User provides job title, company name, basic requirements
  - AI generates professional job description
  - Includes: overview, responsibilities, qualifications, benefits
  - User can edit generated content
- **Rate limits**:
  - Starter: 50 generations per day
  - Professional: 200 per day
  - Enterprise: 1000 per day
- **Caching**: Responses cached to reduce costs and improve speed

### AI Applicant Ranking
- **Location**: Applicant management page
- **Tiers**: Professional, Enterprise
- **How it works**:
  - Compares candidate resume to job description
  - Calculates match score (0-100)
  - Provides match reasons/explanation
  - Can rank individual or bulk applications
- **Benefits**:
  - Prioritize top candidates
  - Save time reviewing applications
  - Objective scoring based on qualifications

### AI Candidate Matching
- **Location**: Resume database search
- **Tiers**: Starter, Professional, Enterprise
- **How it works**:
  - Select a job from dropdown
  - AI matches candidates to job requirements
  - Sorts by match score
  - Shows match percentage and reasons
- **Uses**: Vector similarity search (pgvector)

## How It Works

### AI Request Flow
1. User triggers AI feature (e.g., "Generate JD")
2. Frontend sends request to Edge Function
3. Edge Function checks:
   - User authentication
   - Rate limits (tier-based)
   - Cache for existing responses
4. If not cached:
   - Calls OpenRouter API (Claude model)
   - Stores response in cache
   - Returns result to user
5. If cached:
   - Returns cached response immediately
   - No API call needed

### Rate Limiting
- Each tier has daily limits
- Limits reset at midnight UTC
- Exceeding limit shows error message
- Admin can view usage in AI Usage dashboard

### Caching Strategy
- Responses cached by:
   - User ID
   - Input parameters (job title, requirements, etc.)
- Cache expiration: 24 hours
- Reduces API costs significantly
- Improves response time

### Cost Management
- All AI usage tracked in `ai_usage_logs` table
- Costs calculated per request
- Admin dashboard shows usage and costs
- Tier limits prevent cost overruns

## Technical Details

- **Edge Functions**: 
  - Job description generation
  - Applicant ranking
  - Candidate matching (vector search)
- **API**: OpenRouter (Claude models)
- **Database tables**: 
  - `ai_usage_logs` - Usage tracking
  - `ai_cache` - Response caching
- **Rate limiting**: Tier-based daily limits
- **Cost tracking**: Per-request cost calculation

## User Roles & Permissions

- **Employer (Free)**: 
  - No AI features
- **Employer (Starter)**: 
  - AI job description generator (50/day)
  - AI candidate matching
- **Employer (Professional)**: 
  - AI job description generator (200/day)
  - AI applicant ranking
  - AI candidate matching
- **Employer (Enterprise)**: 
  - AI job description generator (1000/day)
  - AI applicant ranking
  - AI candidate matching
  - Priority support
- **Admins**: Can view all AI usage and costs

## FAQ Items

**Q: Why don't I see the AI job description generator?**
A: This feature requires a Starter tier subscription or higher. Free tier employers can upgrade to access AI features.

**Q: How accurate is AI applicant ranking?**
A: AI ranking provides an objective score based on resume content vs job requirements. It's a helpful tool, but you should still review candidates manually. Scores of 80+ typically indicate strong matches.

**Q: Can I use AI features unlimited times?**
A: No, each tier has daily rate limits to manage costs. Starter: 50 JD generations/day, Professional: 200/day, Enterprise: 1000/day.

**Q: What happens if I exceed my rate limit?**
A: You'll see an error message indicating you've reached your daily limit. Limits reset at midnight UTC. You can upgrade your tier for higher limits.

**Q: Can I edit AI-generated content?**
A: Yes, all AI-generated content can be edited. The AI provides a starting point that you can customize to fit your needs.

**Q: How much does AI usage cost?**
A: AI costs are included in your subscription. There are no additional per-use charges. Tier limits ensure cost control.

**Q: Is my data used to train AI models?**
A: No, your job descriptions, resumes, and other data are not used to train AI models. Data is only used for the specific AI feature you're using.

**Q: Can I see my AI usage statistics?**
A: Admins can view AI usage in the admin dashboard. Employer-level usage stats may be added in the future.

## Related Features

- [Job Posting](./JOB_POSTING.md) - AI job description generator
- [Applicants](./APPLICANTS.md) - AI applicant ranking
- [Candidate Search](./CANDIDATE_SEARCH.md) - AI candidate matching
- [Billing](./BILLING.md) - Upgrade for more AI features

## Future Enhancements

- [ ] AI cover letter analysis
- [ ] AI interview question generation
- [ ] AI candidate screening questions
- [ ] AI job posting optimization suggestions
- [ ] Usage statistics for employers
- [ ] Custom AI prompts
- [ ] Industry-specific AI models
- [ ] Multi-language support
- [ ] AI-powered candidate summaries
- [ ] Predictive hiring analytics

