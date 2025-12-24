# Job Sources Management

## Overview
The job sources management module allows admins to configure, monitor, and manage external job sources like Indeed, Jooble, Adzuna, and RSS feeds. This enables automatic job import from external sources.

## Access
- **Who**: Admins only
- **Location**: `/admin/job-sources`
- **Requirements**: Admin role required

## Current Features

### Source Configuration
- View all configured job sources
- Add new job sources
- Edit source configuration
- Activate/deactivate sources
- Source types:
  - Indeed API
  - Jooble API
  - Adzuna API
  - RSS Feeds
  - Custom sources

### Source Details
Each source shows:
- Source name and type
- Active/inactive status
- Last sync timestamp
- Sync frequency
- Configuration settings
- API keys (masked)

### Sync Management
- Manual sync trigger
- View sync history
- Sync status monitoring
- Error handling and retry
- Sync logs with details

### Statistics Dashboard
- Active sources count
- Jobs ingested today
- Pending imports count
- Match rate (companies matched)
- Source performance metrics

### Import Queue
- View pending job imports
- Review imported jobs
- Approve/reject imports
- Quality checks
- Duplicate detection

### Quality Metrics
- Job quality scores
- Duplicate detection rate
- Company matching accuracy
- Data completeness metrics
- Source reliability scores

### Feed Health Monitoring
- Feed availability
- Feed parsing errors
- Update frequency
- Content quality
- Alert system for issues

## How It Works

1. **Source Configuration**
   - Admin creates new source
   - Configures API keys/credentials
   - Sets sync frequency
   - Activates source

2. **Sync Process**
   - Scheduled or manual sync triggered
   - Source API/feed called
   - Jobs fetched and normalized
   - Duplicate detection
   - Company matching
   - Jobs imported to `external_jobs` or `jobs` table

3. **Import Queue**
   - New jobs added to import queue
   - Admin reviews and approves
   - Quality checks performed
   - Jobs published or rejected

4. **Monitoring**
   - Sync logs tracked
   - Errors recorded
   - Performance metrics calculated
   - Alerts sent for issues

## Technical Details

- **Key components**: 
  - `src/app/admin/job-sources/page.tsx` - Main sources page
  - `src/app/admin/job-sources/[id]/page.tsx` - Source configuration
  - `src/app/admin/job-sources/imports/page.tsx` - Import queue
  - `src/app/admin/job-sources/quality/page.tsx` - Quality metrics
  - `src/app/admin/job-sources/feeds/page.tsx` - Feed health
- **Server actions**: 
  - `src/app/admin/job-sources/actions.ts` - Source management
  - `src/app/admin/job-sources/imports/actions.ts` - Import management
- **Database tables**: 
  - `job_sources` - Source configurations
  - `job_sync_logs` - Sync history
  - `external_jobs` - Imported jobs
  - `jobs` - Published jobs
- **Edge functions**: 
  - `sync-job-source` - Syncs a job source
  - `process-external-jobs` - Processes imported jobs

## User Roles & Permissions

- **Admin**: Full access to all job source features
- **Non-Admin**: Cannot access

## FAQ Items

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

## Related Features

- [Dashboard](../admin/OVERVIEW.md) - Admin overview
- [Settings](./SETTINGS.md) - Source-related settings

## Future Enhancements

- [ ] Automated quality scoring
- [ ] Source performance analytics
- [ ] Custom source templates
- [ ] Webhook support for job sources
- [ ] Advanced duplicate detection
- [ ] Source-specific normalization rules
- [ ] Bulk source operations
- [ ] Source health alerts
- [ ] Integration with more job boards
- [ ] Machine learning for job matching

