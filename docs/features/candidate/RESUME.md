# AI Resume Builder

## Overview
The AI Resume Builder helps candidates optimize their resumes for ATS (Applicant Tracking System) compatibility and improve their job search success. It provides AI-powered analysis, scoring, and optimization suggestions.

## Access
- **Who**: Candidates (authenticated)
- **Location**: `/account/candidate/resume`
- **Requirements**: 
  - User must be authenticated
  - User must have a candidate profile
  - Resume upload recommended for best results

## Current Features

### Current Resume Score Display
- Shows ATS compatibility score (0-100)
- Color-coded score indicator:
  - Green (80-100): Excellent
  - Yellow (60-79): Good, room for improvement
  - Red (0-59): Needs significant work
- Displays last analysis date

### Saved Versions
- View all saved resume versions
- Shows version name, creation date
- Indicates primary version
- Displays ATS score for each version
- Allows comparison between versions

### Resume Analysis
- Paste resume text content
- AI analyzes for:
  - ATS compatibility
  - Keyword optimization
  - Content quality
  - Formatting suggestions
- Provides detailed feedback and recommendations

### AI Resume Optimization (Premium Feature)
- AI-powered resume rewriting
- Optimizes sections for specific job applications
- Maintains truthfulness while improving presentation
- Generates ATS-friendly versions
- Saves optimized versions for comparison

### How It Works Guide
- Step-by-step instructions:
  1. Paste Your Resume
  2. Get AI Analysis
  3. Optimize (Premium)

## How It Works

1. **Resume Text Input**
   - User pastes resume content into text area
   - Text is sent to AI analysis endpoint
   - Analysis performed by Edge Function

2. **ATS Score Calculation**
   - AI evaluates resume against ATS best practices
   - Checks for:
     - Proper formatting
     - Keyword density
     - Section completeness
     - Industry standards
   - Returns score (0-100) and detailed feedback

3. **Resume Optimization (Premium)**
   - User selects sections to optimize
   - AI rewrites selected sections
   - Maintains original meaning while improving:
     - Keyword usage
     - Action verb usage
     - Quantifiable achievements
     - Professional tone
   - New version saved for comparison

4. **Version Management**
   - Each optimization creates a new version
   - Versions can be named and compared
   - Primary version can be set
   - Versions stored in database

## Technical Details

- **Key components**: 
  - `src/app/account/candidate/resume/page.tsx` - Main resume builder page
  - `src/app/account/candidate/resume/ResumeBuilder.tsx` - Builder component with AI integration
- **Server actions**: 
  - `src/app/account/candidate/resume/actions.ts` - Get versions, save versions
- **Database tables**: 
  - `candidates` - Stores resume_text, resume_ats_score, resume_analyzed_at
  - `resume_versions` - Stores saved optimized versions (if implemented)
- **Edge functions**: 
  - Resume analysis function (calls OpenRouter API)
  - Resume optimization function (Premium tier)

## User Roles & Permissions

- **Candidate (Free Tier)**: 
  - Basic resume analysis
  - View current ATS score
  - Limited analysis features
- **Candidate (Premium Tier)**: 
  - Full AI resume optimization
  - Unlimited analysis
  - Save multiple versions
  - Advanced suggestions
- **Employers**: Cannot access candidate resume builder
- **Admins**: Can view usage statistics

## FAQ Items

**Q: How accurate is the ATS score?**
A: The ATS score is based on industry best practices and common ATS requirements. While it's a good indicator, actual ATS systems vary. A score of 80+ is generally considered excellent.

**Q: Do I need a Premium subscription to use the resume builder?**
A: No, free users can get basic analysis and ATS scoring. Premium unlocks AI-powered optimization and rewriting features.

**Q: Can I use the optimized resume directly?**
A: Yes, you can copy the optimized text and use it. However, you may want to review and customize it to ensure it accurately represents your experience.

**Q: How many versions can I save?**
A: Premium users can save multiple versions. Free users have limited version storage.

**Q: Will the AI change my work history?**
A: No, the AI maintains factual accuracy. It only improves presentation, wording, and formatting while keeping your actual experience and dates unchanged.

**Q: How often should I analyze my resume?**
A: It's recommended to analyze your resume when you make significant updates or when applying to different types of roles. The analysis helps ensure your resume is optimized for each application.

## Related Features

- [Profile Management](./PROFILE.md) - Upload resume file
- [Job Search](./JOB_SEARCH.md) - Optimized resume improves job matching
- [Applications](./APPLICATIONS.md) - Better resume increases application success
- [Billing](./BILLING.md) - Upgrade to Premium for full features

## Future Enhancements

- [ ] Industry-specific optimization templates
- [ ] Job-specific resume tailoring
- [ ] Cover letter generation (V3)
- [ ] Resume export to PDF with formatting
- [ ] Integration with profile for auto-updates
- [ ] Comparison view between versions
- [ ] Resume templates library

