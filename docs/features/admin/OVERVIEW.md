# Admin Console Overview

## Overview
The admin console provides platform administrators with tools to manage the entire job board platform, including companies, candidates, job sources, AI usage, and system settings.

## Access
- **Who**: Platform administrators only
- **Location**: `/admin`
- **Requirements**: 
  - User must be authenticated
  - User must have admin role in `user_roles` table

## Current Modules

### Dashboard
- Overview of platform activity
- Quick links to all admin modules
- Key statistics and metrics

### Companies Management
- View all employer companies
- Verify/unverify companies
- Activate/deactivate companies
- Filter by status and verification

### Candidates Management
- View all candidate accounts
- Activate/deactivate candidates
- Control resume search visibility
- Filter by status and searchability

### Job Sources Management
- Configure external job sources (Indeed, Jooble, Adzuna, RSS)
- Monitor sync status
- View sync history
- Manage import queue
- Quality metrics

### HubSpot Integration
- Sync companies from HubSpot
- View sync status
- Manage sync settings
- Handle sync conflicts

### AI Usage Monitoring
- Track AI feature usage
- Monitor costs
- View rate limit usage by tier
- Cache performance metrics
- Recent activity logs

### Settings
- Feature flags
- Platform configuration
- System settings

## How It Works

1. **Access Control**
   - Admin role checked on every admin page
   - Non-admins redirected or see 403 error
   - Role stored in `user_roles` table

2. **Data Management**
   - Admins can view and modify all data
   - Bypasses normal RLS policies
   - Uses admin Supabase client
   - Full CRUD operations available

3. **Monitoring**
   - Real-time data views
   - Historical data tracking
   - Analytics and reporting
   - System health monitoring

## Technical Details

- **Key components**: 
  - `src/app/admin/page.tsx` - Admin dashboard
  - `src/app/admin/layout.tsx` - Admin layout with sidebar
  - `src/components/admin/AdminSidebar.tsx` - Navigation sidebar
- **Server actions**: Various admin actions in each module
- **Database tables**: All tables (admin has full access)
- **Authentication**: Admin role check via `user_roles` table

## User Roles & Permissions

- **Admin**: Full access to all admin features
- **Non-Admin Users**: Cannot access admin console
- **System**: Admin actions logged for audit

## FAQ Items

**Q: How do I become an admin?**
A: Admin access must be granted by an existing admin or system administrator. Contact your platform administrator.

**Q: Can I undo admin actions?**
A: Most admin actions can be reversed (e.g., reactivate a company). Some actions like deletions may be permanent. Check the specific feature documentation.

**Q: Are admin actions logged?**
A: Admin actions are tracked in the system. Full audit logging may be added in future releases.

**Q: Can I export data from admin console?**
A: Export functionality varies by module. CSV exports are available for some data views. Check individual module documentation.

## Related Features

- [Companies](./COMPANIES.md) - Company management
- [Candidates](./CANDIDATES.md) - Candidate management
- [Job Sources](./JOB_SOURCES.md) - External job source management
- [HubSpot](./HUBSPOT.md) - HubSpot integration
- [AI Usage](./AI_USAGE.md) - AI monitoring
- [Settings](./SETTINGS.md) - Platform settings

## Future Enhancements

- [ ] Admin activity logs
- [ ] Bulk operations
- [ ] Advanced analytics dashboard
- [ ] System health monitoring
- [ ] User management (create/edit users)
- [ ] Role management
- [ ] Audit trail
- [ ] Data export tools
- [ ] System backups management
- [ ] Performance monitoring

