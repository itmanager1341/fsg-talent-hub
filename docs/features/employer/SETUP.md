# Company Setup

## Overview
The company setup flow allows new users to create their employer account and company profile. This is the first step for employers to start posting jobs and accessing employer features.

## Access
- **Who**: Authenticated users (not yet employers)
- **Location**: `/employers/setup`
- **Requirements**: 
  - User must be authenticated
  - User must not already be an employer (redirects to dashboard if already set up)

## Current Features

### Company Setup Form
- **Company Name** (required) - Official company name
- **Company Website** (optional) - Company website URL
- **Company Description** (optional) - About the company
- **Industry** (optional) - Company industry
- **Company Size** (optional) - Number of employees
- **Location** (optional) - City and state

### Form Validation
- Company name is required
- Website URL validation (if provided)
- Email pre-filled from user account
- Form submission creates company and links user

### Automatic Redirect
- If user is already an employer, automatically redirects to dashboard
- Prevents duplicate company creation
- Checks `company_users` table for existing association

## How It Works

1. **Page Load**
   - Checks if user is already an employer
   - If yes, redirects to `/employers/dashboard`
   - If no, shows setup form
   - Pre-fills email from authenticated user

2. **Form Submission**
   - Validates required fields (company name)
   - Creates company record in `companies` table
   - Creates `company_users` record linking user to company
   - Sets user role as 'owner' (first user is always owner)
   - Redirects to employer dashboard

3. **Company Creation**
   - Company slug generated from name
   - Default tier set to 'free'
   - Company status set to active
   - User becomes company owner

4. **Post-Setup**
   - User can immediately post jobs
   - Access to all employer features (tier-dependent)
   - Can invite team members (premium feature)

## Technical Details

- **Key components**: 
  - `src/app/employers/setup/page.tsx` - Setup page
  - `src/app/employers/setup/CompanySetupForm.tsx` - Setup form component
- **Server actions**: 
  - `src/app/employers/setup/actions.ts` - Create company, link user
- **Database tables**: 
  - `companies` - Company records
  - `company_users` - User-company associations
- **Edge functions**: None

## User Roles & Permissions

- **New User**: Can create company and become owner
- **Existing Employer**: Redirected to dashboard (cannot create duplicate)
- **Admins**: Can create companies on behalf of users

## FAQ Items

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

## Related Features

- [Dashboard](./DASHBOARD.md) - Access after setup
- [Job Posting](./JOB_POSTING.md) - Start posting jobs
- [Settings](./SETTINGS.md) - Edit company profile later

## Future Enhancements

- [ ] Company verification during setup
- [ ] HubSpot company sync during setup
- [ ] Industry-specific setup questions
- [ ] Logo upload during setup
- [ ] Multi-company support for users
- [ ] Company invitation system
- [ ] Setup wizard with progress indicator

