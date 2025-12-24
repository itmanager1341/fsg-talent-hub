# FSG Talent Hub - FAQ Source

This document consolidates frequently asked questions from all feature documentation. Questions are organized by category for easy reference.

## Getting Started

### General Platform Questions

**Q: What is FSG Talent Hub?**
A: FSG Talent Hub is a job board platform connecting candidates with employers in the financial services industry. It includes AI-powered features for both job seekers and employers.

**Q: Do I need to create separate accounts for candidate and employer?**
A: No, you can have both candidate and employer roles on the same account. When you sign up, you choose your primary role, but you can add the other role later.

**Q: Is the platform free to use?**
A: Both candidates and employers have free tiers with basic features. Premium features require paid subscriptions. See billing documentation for details.

## Candidate FAQs

### Profile & Account

**Q: How do I complete my profile?**
A: Click "Edit Profile" from the dashboard or the profile completion alert. You need to add your name, headline, and upload a resume.

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

### Job Search & Applications

**Q: How do I search for remote jobs?**
A: Use the Location filter and select "Remote" or use the Work Setting filter and select "Remote".

**Q: Can I save my search filters?**
A: Currently, filters are saved in the URL, so you can bookmark filtered searches. Future versions may include saved search alerts.

**Q: What's the difference between internal and external jobs?**
A: Internal jobs are posted directly by employers on the platform and you can apply through the site. External jobs are imported from other sources and require applying on the company's website.

**Q: How are similar jobs determined?**
A: Similar jobs use AI-powered vector similarity matching based on job descriptions. Jobs with similar content, requirements, and descriptions are matched.

**Q: Why don't all jobs show salary information?**
A: Employers can choose whether to display salary information. Some jobs may not have salary data, or the employer may have chosen to hide it.

**Q: How often are job listings updated?**
A: Jobs are updated in real-time. New jobs appear as soon as employers post them. External jobs are synced periodically (managed by admins).

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

### Resume Builder & AI Features

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

### Saved Jobs

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

### Billing & Subscription

**Q: Can I cancel my Premium subscription?**
A: Yes, you can cancel at any time. You'll continue to have access until the end of your billing period. Cancellation can be done through the Stripe Customer Portal (coming soon) or by contacting support.

**Q: What payment methods do you accept?**
A: We accept all major credit cards through Stripe's secure payment platform.

**Q: Will I lose my data if I cancel Premium?**
A: No, your profile, applications, and saved jobs remain. You'll lose access to Premium features like AI resume optimization, but your data is preserved.

**Q: How do I know if my upgrade was successful?**
A: After completing checkout, you'll be redirected back to the billing page with a success message. Your tier will update immediately, and Premium features will be available.

**Q: Can I get a refund?**
A: Refund policies are handled through Stripe. Contact support@fsgmedia.com for refund requests.

**Q: What happens when my subscription renews?**
A: Your subscription automatically renews at the end of each billing period. You'll be charged the same amount, and your Premium access continues uninterrupted.

**Q: Do you offer annual plans?**
A: Currently, only monthly Premium subscriptions are available. Annual plans may be added in the future.

## Employer FAQs

### Company Setup & Profile

**Q: Can I create multiple companies?**
A: Currently, each user account can be associated with one company. To manage multiple companies, you would need separate user accounts.

**Q: What if my company already exists?**
A: If your company was created by another user, you can request to be added as a team member. Contact support for assistance.

**Q: Can I change my company name later?**
A: Yes, you can edit your company profile from the settings page after setup is complete.

**Q: What happens if I don't complete setup?**
A: You won't be able to access employer features until setup is complete. You can return to the setup page at any time.

**Q: Do I need to verify my company?**
A: Company verification is handled by admins. Your company will be reviewed and verified after creation. You can still post jobs while verification is pending.

### Job Posting

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

**Q: What's the difference between job statuses?**
A: 
- **Draft**: Not published, not visible to candidates
- **Active**: Published and visible in job search
- **Paused**: Temporarily hidden from search
- **Closed**: No longer accepting applications
- **Expired**: Past expiration date

### Applicant Management

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

### Candidate Search & Resume Database

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

### AI Features

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

### Billing & Subscription

**Q: Can I cancel my subscription?**
A: Yes, you can cancel at any time. Contact support or use the Stripe Customer Portal (coming soon). You'll continue to have access until the end of your billing period.

**Q: What happens if I downgrade?**
A: You'll need to ensure you don't exceed the limits of your new tier (e.g., close excess jobs). Contact support to downgrade. You'll lose access to premium features immediately upon downgrade.

**Q: Can I upgrade mid-month?**
A: Yes, you can upgrade at any time. Your new tier and features are available immediately. Billing is prorated (handled by Stripe).

**Q: What payment methods do you accept?**
A: We accept all major credit cards through Stripe's secure payment platform.

**Q: Do you offer annual plans?**
A: Currently, only monthly subscriptions are available. Annual plans may be added in the future with discounts.

**Q: What happens to my jobs if I cancel?**
A: Your jobs remain active until you manually close them or they expire. You'll lose access to premium features, but basic job management continues.

**Q: Can I get a refund?**
A: Refund policies are handled through Stripe. Contact support@fsgmedia.com for refund requests. Refunds are typically prorated.

**Q: How do I update my payment method?**
A: Payment method updates can be done through the Stripe Customer Portal (coming soon) or by contacting support.

### Team Management

**Q: How do I add team members?**
A: Team invitations are coming soon. Currently, team members must be added by admins. Contact support to add team members.

**Q: Can I change a team member's role?**
A: Role management is planned for a future release. Currently, roles must be changed by admins. Contact support for role changes.

**Q: What's the difference between Recruiter and Viewer roles?**
A: Recruiters can create jobs, manage applicants, and use all hiring features. Viewers have read-only access and cannot make changes.

**Q: How many team members can I have?**
A: Team size limits may vary by tier. Contact support for details on team member limits for your subscription.

**Q: Can a team member access billing?**
A: Only Owners and users with a "billing" role can access billing. Recruiters and Viewers cannot view or manage billing.

**Q: What happens if I remove a team member?**
A: They lose access to the company's jobs and applicants immediately. Their historical actions remain in the system for audit purposes.

**Q: Can I have multiple owners?**
A: Currently, only one owner per company. Multiple owners may be supported in the future.

## Admin FAQs

### General Admin Questions

**Q: How do I become an admin?**
A: Admin access must be granted by an existing admin or system administrator. Contact your platform administrator.

**Q: Can I undo admin actions?**
A: Most admin actions can be reversed (e.g., reactivate a company). Some actions like deletions may be permanent. Check the specific feature documentation.

**Q: Are admin actions logged?**
A: Admin actions are tracked in the system. Full audit logging may be added in future releases.

**Q: Can I export data from admin console?**
A: Export functionality varies by module. CSV exports are available for some data views. Check individual module documentation.

### Job Sources

**Q: How often do job sources sync?**
A: Sync frequency is configurable per source. Common frequencies are hourly, daily, or on-demand. Check the source configuration.

**Q: What happens if a sync fails?**
A: Sync errors are logged and displayed in the sync history. The system will retry failed syncs automatically. Admins can also manually trigger retries.

**Q: How are duplicates detected?**
A: Duplicate detection uses job title, company name, and location matching. Advanced algorithms compare job descriptions for similarity.

**Q: Can I manually approve every imported job?**
A: Yes, jobs can be set to require manual approval before publishing. This is configurable per source.

**Q: What's the difference between external_jobs and jobs tables?**
A: `external_jobs` stores raw imported jobs before processing. `jobs` contains published jobs that are visible to candidates. Jobs move from external_jobs to jobs after approval.

**Q: How do I add a new job source?**
A: Use the "Add Source" button, select the source type, and configure the required settings (API keys, endpoints, etc.). Test the connection before activating.

### Candidate & Company Management

**Q: What's the difference between active and searchable?**
A: Active controls whether a candidate can log in and use the platform. Searchable controls whether their profile appears in the employer resume database. A candidate can be active but hidden from search.

**Q: What happens when I deactivate a candidate?**
A: The candidate cannot log in to their account. Their data is preserved, and they can be reactivated later. Their applications and saved jobs remain in the system.

**Q: What's the difference between verified and active?**
A: Verified means the company has been reviewed and confirmed as legitimate. Active controls whether the company can use the platform. A company can be verified but inactive (suspended), or active but unverified (pending review).

**Q: What happens when I deactivate a company?**
A: The company cannot access their employer dashboard. Their jobs remain visible but marked as inactive. Company users cannot log in. Data is preserved for reactivation.

**Q: How do I verify a company?**
A: Review the company information, check their website, and verify their legitimacy. Then click the "Verify" button. Verification builds trust with candidates.

### HubSpot Integration

**Q: How often should I sync from HubSpot?**
A: Sync frequency depends on how often HubSpot data changes. Daily or weekly syncs are common. Manual syncs can be triggered as needed.

**Q: What happens if a company in HubSpot doesn't exist on the platform?**
A: A new company record is created on the platform with data from HubSpot. The company will need to be verified and activated by an admin.

**Q: What if platform data conflicts with HubSpot data?**
A: Conflicts are flagged for admin review. Admins can choose to keep platform data, HubSpot data, or manually resolve the conflict.

**Q: What HubSpot fields are synced?**
A: Common fields include company name, website, description, industry, size, location, and membership status. Check the sync configuration for exact field mappings.

**Q: Do I need HubSpot API credentials?**
A: Yes, HubSpot API credentials must be configured in the system settings or environment variables for the sync to work.

### AI Usage

**Q: How accurate are the cost estimates?**
A: Costs are based on actual API usage and current pricing. They're estimates and may vary slightly from actual bills due to rate changes or rounding.

**Q: What's a good cache hit rate?**
A: A cache hit rate above 50% is good, above 70% is excellent. Higher cache rates reduce costs and improve response times.

**Q: How do I reduce AI costs?**
A: Increase cache hit rates by optimizing prompts, implement better caching strategies, adjust rate limits, or encourage users to reuse generated content.

**Q: What happens when a company hits their rate limit?**
A: They'll see an error message and cannot use AI features until the limit resets (midnight UTC) or they upgrade their tier.

**Q: Can I see usage for a specific company?**
A: The recent activity table shows company-level usage. More detailed company analytics may be added in the future.

## Support & Contact

For additional questions or support:
- Email: support@fsgmedia.com
- Check feature-specific documentation
- Review this FAQ for common questions

