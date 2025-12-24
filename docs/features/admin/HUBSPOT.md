# HubSpot Integration

## Overview
The HubSpot integration module allows admins to sync company data from HubSpot CRM to the platform. This ensures company information stays up-to-date and leverages existing CRM data.

## Access
- **Who**: Admins only
- **Location**: `/admin/hubspot`
- **Requirements**: Admin role required

## Current Features

### Sync Management
- Manual sync trigger
- View sync status
- Sync history
- Error handling
- Sync configuration

### Company Sync
- Sync companies from HubSpot
- Map HubSpot fields to platform fields
- Handle sync conflicts
- Update company information
- Create new companies from HubSpot

### Sync Status
- Last sync timestamp
- Sync success/failure status
- Number of companies synced
- Sync errors and warnings
- Sync statistics

## How It Works

1. **Sync Trigger**
   - Admin clicks "Sync from HubSpot" button
   - Edge Function or server action triggered
   - HubSpot API called to fetch companies
   - Companies processed and synced

2. **Company Matching**
   - Existing companies matched by HubSpot ID
   - New companies created if not found
   - Company data updated from HubSpot

3. **Conflict Resolution**
   - If platform data differs from HubSpot
   - Admin can review conflicts
   - Choose which data to keep
   - Manual resolution process

4. **Sync Logging**
   - All syncs logged
   - Success/failure tracked
   - Errors recorded
   - Statistics calculated

## Technical Details

- **Key components**: 
  - `src/app/admin/hubspot/page.tsx` - HubSpot sync page
  - `src/app/admin/hubspot/HubSpotSyncButton.tsx` - Sync button
- **Server actions**: 
  - HubSpot sync logic (may be in Edge Function)
- **Database tables**: 
  - `companies` - Company records
  - `hubspot_sync_logs` - Sync history (if exists)
- **External services**: 
  - HubSpot API - Company data source
- **Edge functions**: 
  - HubSpot sync function (if implemented)

## User Roles & Permissions

- **Admin**: Full access to HubSpot sync
- **Non-Admin**: Cannot access

## FAQ Items

**Q: How often should I sync from HubSpot?**
A: Sync frequency depends on how often HubSpot data changes. Daily or weekly syncs are common. Manual syncs can be triggered as needed.

**Q: What happens if a company in HubSpot doesn't exist on the platform?**
A: A new company record is created on the platform with data from HubSpot. The company will need to be verified and activated by an admin.

**Q: What if platform data conflicts with HubSpot data?**
A: Conflicts are flagged for admin review. Admins can choose to keep platform data, HubSpot data, or manually resolve the conflict.

**Q: Can I sync other data besides companies?**
A: Currently, the integration focuses on company data. Additional data types may be added in the future.

**Q: What HubSpot fields are synced?**
A: Common fields include company name, website, description, industry, size, location, and membership status. Check the sync configuration for exact field mappings.

**Q: Do I need HubSpot API credentials?**
A: Yes, HubSpot API credentials must be configured in the system settings or environment variables for the sync to work.

## Related Features

- [Dashboard](./OVERVIEW.md) - Admin overview
- [Companies](./COMPANIES.md) - View synced companies
- [Settings](./SETTINGS.md) - HubSpot configuration

## Future Enhancements

- [ ] Automated scheduled syncs
- [ ] Bidirectional sync (platform → HubSpot)
- [ ] Contact/lead sync
- [ ] Deal/opportunity sync
- [ ] Custom field mappings
- [ ] Sync conflict resolution UI
- [ ] Sync preview before applying
- [ ] Selective sync (choose which companies)
- [ ] Sync filters (by HubSpot properties)
- [ ] Webhook support for real-time updates

