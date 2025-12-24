# Team Management

## Overview
The team management feature allows company owners to view team members, understand roles, and manage access. Team collaboration helps distribute hiring workload across multiple recruiters.

## Access
- **Who**: Employers (authenticated)
- **Location**: `/employers/team`
- **Requirements**: 
  - User must be authenticated employer
  - Company must be set up
  - Premium tier required for adding team members (future)

## Current Features

### Team Members List
- Displays all team members for the company
- Shows user email (if available)
- Role badge (Owner, Recruiter, Viewer)
- Join date
- Current user highlighted as "You"

### Team Roles
Three role types:

#### Owner
- Full access to all features
- Can manage billing
- Can manage team (future)
- Can delete company
- First user who creates company is owner

#### Recruiter
- Can create and manage job postings
- Can view and manage applicants
- Can access resume database
- Cannot manage billing
- Cannot manage team

#### Viewer
- Read-only access
- Can view jobs and applications
- Cannot make changes
- Cannot post jobs
- Cannot access resume database

### Upgrade CTA (Free Tier)
- Free tier employers see upgrade prompt
- Explains that team features require premium
- Direct link to billing page

### Role Explanations
- Detailed description of each role
- Permissions breakdown
- Helps owners understand access levels

## How It Works

1. **Page Load**
   - Fetches all `company_users` for the company
   - Loads user information (email, etc.)
   - Checks current user's role
   - Displays team members list

2. **Role Display**
   - Each team member shows their role
   - Color-coded role badges
   - Current user marked as "You"
   - Join date displayed

3. **Team Invitations (Future)**
   - Owners can invite new team members
   - Invitation sent via email
   - User accepts and joins company
   - Role assigned during invitation

4. **Role Management (Future)**
   - Owners can change team member roles
   - Can remove team members
   - Activity logs tracked

## Technical Details

- **Key components**: 
  - `src/app/employers/team/page.tsx` - Team management page
- **Server actions**: None (currently read-only)
- **Database tables**: 
  - `company_users` - Links users to companies with roles
  - `companies` - Company information
  - `users` - User accounts (auth.users)

## User Roles & Permissions

- **Employer (Owner)**: 
  - Can view team members
  - Can manage team (future feature)
  - Can change roles (future)
  - Can remove members (future)
- **Employer (Recruiter/Viewer)**: 
  - Can view team members list
  - Cannot manage team
- **Admins**: Can view all teams and manage roles

## FAQ Items

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

## Related Features

- [Dashboard](./DASHBOARD.md) - Quick access to team management
- [Billing](./BILLING.md) - Upgrade for team features
- [Settings](./SETTINGS.md) - Company settings

## Future Enhancements

- [ ] Team member invitations (email-based)
- [ ] Role management (change roles)
- [ ] Remove team members
- [ ] Activity logs (who did what)
- [ ] Permission granularity
- [ ] Team member limits by tier
- [ ] Bulk team operations
- [ ] Team member profiles
- [ ] Department/organization structure
- [ ] Team analytics

