# Candidate Management

## Overview
The candidate management module allows admins to view, activate, deactivate, and control the search visibility of all candidate accounts on the platform.

## Access
- **Who**: Admins only
- **Location**: `/admin/candidates`
- **Requirements**: Admin role required

## Current Features

### Candidate List
- View all candidate accounts
- Display candidate name, email
- Active/inactive status
- Searchable/hidden status
- Account creation date
- Quick actions

### Status Management
- **Activate/Deactivate**: Control account access
  - Active: Candidate can use platform
  - Inactive: Candidate cannot log in
- **Searchable/Hidden**: Control resume database visibility
  - Searchable: Appears in employer resume search
  - Hidden: Not visible to employers

### Filtering Options
- Filter by status (all, active, inactive)
- Filter by searchability (all, searchable, hidden)
- Combined filters supported
- Results limited to 200 for performance

### Bulk Operations
- View filtered candidate lists
- Individual status updates
- Status change via form actions

## How It Works

1. **Page Load**
   - Fetches candidates from database
   - Applies filters from URL parameters
   - Orders by creation date (newest first)
   - Limits to 200 results

2. **Status Updates**
   - Admin clicks activate/deactivate button
   - Server action updates `candidates.is_active` flag
   - Change takes effect immediately
   - Candidate access affected immediately

3. **Searchability Control**
   - Admin clicks searchable/hidden button
   - Server action updates `candidates.is_searchable` flag
   - Change affects resume database visibility
   - Employers see updated status in search

4. **Filtering**
   - Admin selects filter options
   - URL updates with filter parameters
   - Page reloads with filtered results
   - Filters can be combined

## Technical Details

- **Key components**: 
  - `src/app/admin/candidates/page.tsx` - Candidate list page
- **Server actions**: 
  - `src/app/admin/candidates/actions.ts` - Activate, deactivate, set searchable
- **Database tables**: 
  - `candidates` - Candidate accounts
  - `users` - User authentication (auth.users)

## User Roles & Permissions

- **Admin**: Full access to candidate management
- **Candidates**: Cannot access admin features
- **Employers**: Can only see searchable candidates in resume database

## FAQ Items

**Q: What's the difference between active and searchable?**
A: Active controls whether a candidate can log in and use the platform. Searchable controls whether their profile appears in the employer resume database. A candidate can be active but hidden from search.

**Q: What happens when I deactivate a candidate?**
A: The candidate cannot log in to their account. Their data is preserved, and they can be reactivated later. Their applications and saved jobs remain in the system.

**Q: Can I see candidate resumes from this page?**
A: This page shows candidate account information. To view resumes, you would need to access the candidate's profile or use the resume database search.

**Q: How do I find a specific candidate?**
A: Use the email or name to search. The list shows the most recent candidates first. For large lists, use the filters to narrow down results.

**Q: Can I delete a candidate account?**
A: Currently, accounts are deactivated rather than deleted to preserve data integrity. Account deletion may be added in the future with proper data handling.

**Q: What happens to a candidate's applications if I deactivate them?**
A: Applications remain in the system and are still visible to employers. The candidate just cannot log in or make new applications.

## Related Features

- [Dashboard](./OVERVIEW.md) - Admin overview
- [Companies](./COMPANIES.md) - Company management

## Future Enhancements

- [ ] Candidate search functionality
- [ ] Bulk status updates
- [ ] Candidate account deletion (with data handling)
- [ ] Candidate activity logs
- [ ] Email candidate from admin
- [ ] Candidate analytics
- [ ] Export candidate list
- [ ] Candidate notes/comments
- [ ] Account merge functionality
- [ ] Suspension reasons

