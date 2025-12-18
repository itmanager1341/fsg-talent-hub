# Indeed API Setup Guide

⚠️ **CRITICAL UPDATE**: Indeed's RSS feed endpoint (`/rss`) has been **discontinued** and returns 404 errors. You **must** use the Indeed Publisher API instead.

This guide explains how to set up Indeed as a job source for the FSG Talent Hub platform.

## Overview

Indeed offers one working method to fetch job listings:

1. **Publisher API** (Required) ✅
   - Requires Indeed Publisher account and Publisher ID
   - Official API with proper support
   - Higher rate limits
   - Better for production scale

~~2. **RSS Feeds** (Discontinued) ❌~~
   - ~~No longer available - returns 404 errors~~
   - ~~Has been discontinued by Indeed~~

## Option 1: Publisher API Setup (Required)

### Step 1: Create Indeed Publisher Account

1. Go to [Indeed Publisher Program](https://www.indeed.com/publisher)
2. Sign up for a Publisher account
3. Complete the application process
   - Provide your website details
   - Explain how you'll use the job listings
   - Agree to Indeed's terms of service

### Step 2: Get Your Publisher ID

1. Once approved, log into your Indeed Publisher account
2. Navigate to your account settings
3. Find your **Publisher ID** (also called "Publisher Code")
   - Format: Usually a numeric string like `1234567890123456`
   - Keep this secure - it's your API credential

### Step 3: Create Job Source with Publisher ID

1. Navigate to `/admin/job-sources/new`
2. Fill in the form:
   - **Source Name**: `indeed_api` (must include "indeed" in the name)
   - **Source Type**: `API`
   - **Search Query**: Enter your search terms
     - Example: `mortgage servicing OR M&A advisory OR financial services`
   - **Location** (Optional): City, State, or ZIP code
     - Example: `New York, NY` or `10001`
   - **Publisher ID**: Enter your Publisher ID from Step 2

### Step 4: Configure Search Parameters

**Search Query Tips**:
- Use `OR` for multiple keywords: `mortgage OR servicing OR M&A`
- Use quotes for exact phrases: `"mortgage servicing"`
- Combine terms: `(mortgage servicing) OR (M&A advisory)`

**Location Options**:
- City and State: `New York, NY`
- ZIP Code: `10001`
- State only: `NY`
- Leave empty for nationwide search

### Step 5: Test the Source

1. After creating the source, click **"Sync Now"** button
2. Check the sync logs to see:
   - Jobs found
   - Jobs imported
   - Any errors

**Note**: The Publisher API integration is currently being implemented. If you see an error about "not yet implemented", please use alternative sources (Adzuna, Jooble) in the meantime.

### Step 6: Monitor Results

- View imported jobs in `/admin/job-sources/imports`
- Check sync history on the main job sources page
- Review source quality metrics in `/admin/job-sources/quality`

## Alternative Sources (While Publisher API is Being Implemented)

Since Indeed RSS feeds are discontinued and the Publisher API integration is in progress, consider these alternatives:

### Adzuna API
- Free tier available
- Good coverage of job listings
- Easy to set up
- See: Create source with name containing "adzuna"

### Jooble API
- Free API access
- Good job coverage
- Easy to set up
- See: Create source with name containing "jooble"

### Generic RSS Feeds
- Company career page RSS feeds
- Industry-specific job board RSS feeds
- Use the Feed Discovery tool at `/admin/job-sources/feeds`

## Troubleshooting

### Error: "Indeed RSS feeds have been discontinued"
- **Solution**: Use the Publisher API instead (see Option 1 above)
- Get a Publisher ID from https://www.indeed.com/publisher

### Error: "Indeed Publisher API integration is not yet implemented"
- **Solution**: Use alternative sources (Adzuna, Jooble) until the Publisher API is implemented
- Or wait for the Publisher API integration to be completed

### Error: 404 Not Found
- **Cause**: Indeed RSS endpoint has been discontinued
- **Solution**: Use Publisher API or alternative sources

## Next Steps

1. **For immediate use**: Set up Adzuna or Jooble API sources
2. **For Indeed integration**: Get a Publisher ID and wait for API implementation
3. **For RSS feeds**: Use company career pages or industry job boards

## Publisher API Implementation Status

The Indeed Publisher API integration is planned but not yet implemented. The edge function will:
- Detect if a Publisher ID is provided
- Return a clear error message if RSS is attempted
- Guide users to use the Publisher API

Once implemented, the Publisher API will support:
- XML/JSON response formats
- Advanced search parameters
- Higher rate limits
- Better job data quality
