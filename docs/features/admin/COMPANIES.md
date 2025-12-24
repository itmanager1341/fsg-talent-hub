# Company Management

## Overview
The company management module allows admins to view, verify, activate, and deactivate all employer companies on the platform. Admins can distinguish between employer companies (with registered users) and prospecting companies (created from job imports), manage company tiers, and control company access. This is essential for maintaining platform quality and trust.

## Access
- **Who**: Admins only
- **Location**: `/admin/companies`
- **Requirements**: Admin role required

## Current Features

### Company List
- View all company accounts
- Display company name, slug
- **Company Type**: Distinguishes between:
  - **Employer Companies**: Companies with registered users (have `company_users` records)
  - **Prospecting Companies**: Companies created from job imports (no users yet)
- **Tier**: Current subscription tier (free, starter, standard, professional, enterprise)
- **User Count**: Number of users associated with the company
- **Job Count**: Number of jobs posted by the company
- Verified/unverified status
- Active/inactive status
- Account creation date
- Quick actions

### Status Management
- **Verify/Unverify**: Control company verification status
  - Verified: Company is trusted and verified
  - Unverified: Company needs verification
- **Activate/Deactivate**: Control company access
  - Active: Company can post jobs and use platform
  - Inactive: Company cannot access platform

### Tier Management
- **Assign Tiers**: Admins can assign subscription tiers to companies without payment
- Available tiers:
  - **Free**: Default tier, basic features
  - **Starter**: Access to resume database
  - **Standard**: Access to resume database
  - **Professional**: Resume database + AI ranking (100 rankings/day)
  - **Enterprise**: Resume database + AI ranking (unlimited)
- Tier changes take effect immediately
- Useful for granting premium features to employers without requiring payment

### Filtering Options
- Filter by company type (all, employers, prospecting)
- Filter by status (all, active, inactive)
- Filter by verification (all, verified, unverified)
- Combined filters supported
- Results limited to 200 for performance

### Bulk Operations
- View filtered company lists
- Individual status updates
- Status change via form actions

## How It Works

1. **Page Load**
   - Fetches companies from database
   - Determines company type by checking for `company_users` records
   - Counts users and jobs for each company
   - Applies filters from URL parameters
   - Orders by creation date (newest first)
   - Limits to 200 results

2. **Verification Updates**
   - Admin clicks verify/unverify button
   - Server action updates `companies.is_verified` flag
   - Change takes effect immediately
   - Verified badge appears on company profile

3. **Activation Updates**
   - Admin clicks activate/deactivate button
   - Server action updates `companies.is_active` flag
   - Change takes effect immediately
   - Company access affected immediately

4. **Tier Management**
   - Admin selects tier from dropdown for each company
   - Server action updates `companies.tier` field
   - Change takes effect immediately
   - Company gains access to tier-specific features

5. **Filtering**
   - Admin selects filter options
   - URL updates with filter parameters
   - Page reloads with filtered results
   - Filters can be combined

## Technical Details

- **Key components**: 
  - `src/app/admin/companies/page.tsx` - Company list page
  - `src/app/admin/companies/TierSelector.tsx` - Client component for tier selection
- **Server actions**: 
  - `src/app/admin/companies/actions.ts` - Verify, activate, deactivate, set tier
- **Database tables**: 
  - `companies` - Company accounts (includes `tier` field)
  - `company_users` - User-company associations (used to determine company type)
  - `jobs` - Job postings (counted per company)

## User Roles & Permissions

- **Admin**: Full access to company management
- **Employers**: Cannot access admin features
- **Candidates**: Can view verified company profiles

## FAQ Items

**Q: What's the difference between verified and active?**
A: Verified means the company has been reviewed and confirmed as legitimate. Active controls whether the company can use the platform. A company can be verified but inactive (suspended), or active but unverified (pending review).

**Q: What happens when I deactivate a company?**
A: The company cannot access their employer dashboard. Their jobs remain visible but marked as inactive. Company users cannot log in. Data is preserved for reactivation.

**Q: How do I verify a company?**
A: Review the company information, check their website, and verify their legitimacy. Then click the "Verify" button. Verification builds trust with candidates.

**Q: Can I see company jobs from this page?**
A: This page shows company account information. To view a company's jobs, navigate to the company profile or use the jobs management (future feature).

**Q: What should I check before verifying a company?**
A: Verify the company name matches their website, check that the website is legitimate, ensure contact information is valid, and confirm they're a real business entity.

**Q: Can I delete a company?**
A: Currently, companies are deactivated rather than deleted to preserve data integrity. Company deletion may be added in the future with proper data handling.

**Q: What happens to a company's jobs if I deactivate them?**
A: Jobs remain in the system but are marked as inactive/closed. They won't appear in job search. Jobs can be reactivated if the company is reactivated.

**Q: What's the difference between Employer and Prospecting companies?**
A: **Employer Companies** have registered users who signed up and created the company account. They can log in, post jobs, and use employer features. **Prospecting Companies** were created automatically when jobs were imported from external sources. They don't have registered users yet and are used for outreach and prospecting purposes. When a prospecting company signs up, they become an employer company.

**Q: How does tier management work?**
A: Admins can assign any tier (free, starter, standard, professional, enterprise) to any company directly from the companies page. This allows granting premium features without requiring payment. The tier dropdown in the Actions column lets you change a company's tier instantly. Changes take effect immediately and grant access to tier-specific features like resume database access and AI ranking.

**Q: What happens when I change a company's tier?**
A: The change takes effect immediately. The company gains access to all features available in the new tier. For example, upgrading to "professional" grants access to the resume database and AI ranking (100 rankings/day). Downgrading removes access to premium features. This does not affect any existing subscriptions or billing - it's an admin override.

**Q: Can a prospecting company become an employer company?**
A: Yes, when a user signs up and creates a company account that matches a prospecting company (by name), or when a user is manually linked to a prospecting company, it becomes an employer company. The company type is automatically determined by the presence of `company_users` records.

## Related Features

- [Dashboard](./OVERVIEW.md) - Admin overview
- [HubSpot](./HUBSPOT.md) - Company sync from HubSpot
- [Candidates](./CANDIDATES.md) - Candidate management

## Future Enhancements

- [ ] Company search functionality
- [ ] Bulk status updates
- [ ] Company account deletion (with data handling)
- [ ] Company activity logs
- [ ] Email company from admin
- [ ] Company analytics
- [ ] Export company list
- [ ] Company notes/comments
- [ ] Verification workflow
- [ ] Company profile review queue
- [ ] Suspension reasons

