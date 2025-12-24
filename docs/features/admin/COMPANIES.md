# Company Management

## Overview
The company management module allows admins to view, verify, activate, and deactivate all employer companies on the platform. This is essential for maintaining platform quality and trust.

## Access
- **Who**: Admins only
- **Location**: `/admin/companies`
- **Requirements**: Admin role required

## Current Features

### Company List
- View all company accounts
- Display company name, slug
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

### Filtering Options
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

4. **Filtering**
   - Admin selects filter options
   - URL updates with filter parameters
   - Page reloads with filtered results
   - Filters can be combined

## Technical Details

- **Key components**: 
  - `src/app/admin/companies/page.tsx` - Company list page
- **Server actions**: 
  - `src/app/admin/companies/actions.ts` - Verify, activate, deactivate
- **Database tables**: 
  - `companies` - Company accounts
  - `company_users` - User-company associations

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
- [ ] Company tier management

