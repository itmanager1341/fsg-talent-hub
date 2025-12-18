# Job Source Sync Troubleshooting Guide

## Issue: "Sync Now" Button Does Nothing

### Symptoms
- Clicking "Sync Now" button shows no immediate feedback
- No jobs appear in the import queue
- Sync logs show errors

### Diagnosis Steps

1. **Check Sync Logs**
   - Navigate to `/admin/job-sources`
   - Scroll to "Sync History" table
   - Look for recent sync attempts
   - Check status column (success, failed, running)
   - Review error messages

2. **Check Source Configuration**
   - Verify source is active (`is_active = true`)
   - Check source type matches configuration
   - Verify API credentials (if using API sources)
   - Check feed URL format (if using RSS)

3. **Check Edge Function Logs**
   - Go to Supabase Dashboard → Edge Functions → `sync-job-source`
   - Review function logs for errors
   - Check execution time and status codes

## Common Issues and Solutions

### Issue 1: 403 Forbidden from Indeed RSS

**Error**: `Indeed RSS fetch failed: 403`

**Causes**:
- Indeed is blocking automated requests
- Missing or incorrect User-Agent header
- Rate limiting
- Bot detection

**Solutions**:
1. **Wait and Retry**: Indeed may have rate-limited your IP. Wait 15-30 minutes and try again.
2. **Use Publisher API**: Instead of RSS, use Indeed Publisher API with a Publisher ID
3. **Check Source Configuration**: Ensure search query and location are properly formatted
4. **Verify Feed URL**: For Indeed RSS, the system builds the URL automatically from `search_query` and `search_location` - don't enter a manual feed_url with placeholders

**For Indeed RSS Sources**:
- The system automatically builds the RSS URL from your search query and location
- You should NOT enter a feed_url with `{query}` or `{location}` placeholders
- Leave feed_url empty or don't configure it for Indeed sources

### Issue 2: Generic RSS Feed Not Working

**Error**: No jobs found, or "RSS feed fetch failed"

**Causes**:
- Invalid feed URL
- Feed requires authentication
- Feed is down or inaccessible
- Feed format not supported

**Solutions**:
1. **Validate Feed URL**: 
   - Use the Feed Discovery tool at `/admin/job-sources/feeds`
   - Or manually test the feed URL in a browser
   - Ensure it returns valid RSS/Atom XML

2. **Check Feed Format**:
   - Feed must be RSS 2.0 or Atom format
   - Test by opening the URL directly in a browser
   - Should see XML content, not HTML

3. **Handle Placeholders**:
   - If feed URL has `{query}` or `{location}` placeholders, they will be automatically replaced
   - Ensure `search_query` and `search_location` are configured in source config

4. **Check Feed Accessibility**:
   - Some feeds require specific headers
   - Some feeds block automated requests
   - Try accessing feed from different network/IP

### Issue 3: No Sync Logs Created

**Symptoms**: Clicking "Sync Now" creates no log entry

**Causes**:
- Edge function not deployed
- Authentication failure
- Network error
- Edge function timeout

**Solutions**:
1. **Verify Edge Function Deployment**:
   ```bash
   # Check if function is deployed
   supabase functions list
   # Or check in Supabase Dashboard
   ```

2. **Check Authentication**:
   - Ensure you're logged in as admin
   - Check browser console for authentication errors
   - Verify `requireAdmin()` is working

3. **Check Network**:
   - Open browser DevTools → Network tab
   - Click "Sync Now" and watch for requests
   - Check for failed requests to `/functions/v1/sync-job-source`

4. **Check Server Logs**:
   - Look for errors in Next.js server logs
   - Check for edge function invocation errors

### Issue 4: Sync Runs But No Jobs Found

**Symptoms**: Sync shows "success" but `jobs_found = 0`

**Causes**:
- Search query too specific
- Location too narrow
- Source has no matching jobs
- API credentials invalid
- Feed is empty

**Solutions**:
1. **Broaden Search Query**:
   - Use more general terms
   - Remove location filter
   - Test query on source website directly

2. **Verify API Credentials**:
   - For API sources, check credentials are valid
   - Test API access manually
   - Check API rate limits

3. **Test Feed Directly**:
   - Open RSS feed URL in browser
   - Verify it contains job listings
   - Check feed is recent/active

4. **Check Source Configuration**:
   - Review search parameters
   - Adjust date range (if supported)
   - Try different location

### Issue 5: Jobs Found But Not Imported

**Symptoms**: `jobs_found > 0` but `jobs_new = 0`, `jobs_updated = 0`

**Causes**:
- All jobs are duplicates
- Jobs failing validation
- Database insertion errors

**Solutions**:
1. **Check Duplicate Detection**:
   - Review `jobs_duplicates` count in sync log
   - If high, duplicate detection is working correctly
   - Consider adjusting duplicate detection logic

2. **Check Error Messages**:
   - Review errors array in sync log
   - Look for validation or insertion errors
   - Fix data issues causing failures

3. **Check Import Queue**:
   - Go to `/admin/job-sources/imports`
   - Review pending jobs
   - Check for jobs stuck in "pending" status

## Debugging Steps

### Step 1: Check Recent Sync Logs

```sql
SELECT * FROM job_sync_logs 
ORDER BY started_at DESC 
LIMIT 5;
```

Look for:
- `status`: Should be "success", "partial", or "failed"
- `errors`: Array of error messages
- `jobs_found`: Number of jobs retrieved
- `jobs_new`: Number of new jobs added

### Step 2: Check Source Configuration

```sql
SELECT id, name, source_type, is_active, config, last_synced_at 
FROM job_sources 
WHERE id = 'YOUR_SOURCE_ID';
```

Verify:
- `is_active = true`
- `config` contains required fields
- `last_synced_at` updated after sync

### Step 3: Check External Jobs

```sql
SELECT COUNT(*), status 
FROM external_jobs 
WHERE source_id = 'YOUR_SOURCE_ID'
GROUP BY status;
```

This shows:
- How many jobs were ingested
- Their current status (pending, matched, imported, etc.)

### Step 4: Test Edge Function Manually

```bash
# Using Supabase CLI
supabase functions invoke sync-job-source \
  --body '{"sourceId": "YOUR_SOURCE_ID"}'
```

Or use the Supabase Dashboard:
1. Go to Edge Functions → `sync-job-source`
2. Click "Invoke Function"
3. Enter: `{"sourceId": "YOUR_SOURCE_ID"}`
4. Review response and logs

## Prevention Tips

1. **Start with RSS Feeds**: Use RSS feeds for testing (no API keys needed)
2. **Test Queries First**: Test search queries on source website before configuring
3. **Monitor Rate Limits**: Don't sync too frequently (hourly is recommended)
4. **Validate Feeds**: Use feed discovery/validation tools before creating sources
5. **Check Logs Regularly**: Review sync history weekly to catch issues early

## Getting Help

If issues persist:

1. **Collect Information**:
   - Source ID
   - Recent sync log entries
   - Error messages
   - Source configuration (without sensitive API keys)

2. **Check Documentation**:
   - Review source-specific setup guides
   - Check API documentation for rate limits
   - Review feed format requirements

3. **Test Manually**:
   - Try accessing source/feed directly
   - Test API credentials manually
   - Verify network connectivity

