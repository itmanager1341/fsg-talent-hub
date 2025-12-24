# AI Usage Monitoring

## Overview
The AI usage monitoring dashboard allows admins to track AI feature usage across the platform, monitor costs, and ensure rate limits are being respected. This is essential for cost control and platform management.

## Access
- **Who**: Admins only
- **Location**: `/admin/ai-usage`
- **Requirements**: Admin role required

## Current Features

### Overview Statistics
- **Requests Today** - Total AI API calls today
- **Cost Today** - Estimated spend on AI today
- **Cache Hit Rate** - Percentage of requests served from cache
- **Active Users** - Number of users using AI features today

### Usage by Tier
- Breakdown of AI usage by subscription tier
- Shows used vs limit for each tier
- Visual progress bars
- Percentage usage displayed
- Color-coded warnings (red at 80%+, yellow at 50%+)

### Rate Limit Warnings
- Companies approaching their tier limits
- Shows company name, tier, usage percentage
- Helps identify companies that may need upgrades
- Alerts for companies at risk of hitting limits

### Cache Performance
- Total cached entries
- Cache hit rate percentage
- Entries expiring today
- Cache efficiency metrics

### Recent Activity
- Table of recent AI usage
- Shows time, company, feature used
- Indicates if response was cached
- Cost per request
- Helps identify usage patterns

## How It Works

1. **Data Collection**
   - All AI requests logged in `ai_usage_logs` table
   - Tracks: user, company, feature, cost, timestamp, cached status
   - Logs created by Edge Functions

2. **Statistics Calculation**
   - Daily stats calculated from logs
   - Aggregated by tier, company, feature
   - Cache hit rate calculated
   - Costs summed

3. **Rate Limit Monitoring**
   - Daily limits checked per tier
   - Usage compared to limits
   - Warnings generated for high usage
   - Companies flagged for review

4. **Cache Tracking**
   - Cache hits vs misses tracked
   - Cache entries counted
   - Expiration dates monitored
   - Performance metrics calculated

## Technical Details

- **Key components**: 
  - `src/app/admin/ai-usage/page.tsx` - AI usage dashboard
- **Server actions**: 
  - `src/app/admin/ai-usage/actions.ts` - Fetch usage statistics
- **Database tables**: 
  - `ai_usage_logs` - All AI requests logged
  - `ai_cache` - Cached responses
  - `companies` - For tier information
- **Edge functions**: 
  - All AI features log usage

## User Roles & Permissions

- **Admin**: Full access to AI usage monitoring
- **Non-Admin**: Cannot access

## FAQ Items

**Q: How accurate are the cost estimates?**
A: Costs are based on actual API usage and current pricing. They're estimates and may vary slightly from actual bills due to rate changes or rounding.

**Q: What's a good cache hit rate?**
A: A cache hit rate above 50% is good, above 70% is excellent. Higher cache rates reduce costs and improve response times.

**Q: How do I reduce AI costs?**
A: Increase cache hit rates by optimizing prompts, implement better caching strategies, adjust rate limits, or encourage users to reuse generated content.

**Q: What happens when a company hits their rate limit?**
A: They'll see an error message and cannot use AI features until the limit resets (midnight UTC) or they upgrade their tier.

**Q: Can I see usage for a specific company?**
A: The recent activity table shows company-level usage. More detailed company analytics may be added in the future.

**Q: How far back does the data go?**
A: Usage data is stored indefinitely, but the dashboard focuses on today's usage. Historical data can be queried from the database.

**Q: Can I export usage data?**
A: Currently, data is view-only in the dashboard. Export functionality may be added in the future.

## Related Features

- [Dashboard](./OVERVIEW.md) - Admin overview
- [Settings](./SETTINGS.md) - AI configuration

## Future Enhancements

- [ ] Historical usage trends
- [ ] Usage forecasting
- [ ] Cost budgeting and alerts
- [ ] Company-level usage reports
- [ ] Feature-level usage breakdown
- [ ] Export usage data to CSV
- [ ] Usage comparison (period over period)
- [ ] Anomaly detection
- [ ] Automated cost alerts
- [ ] Usage optimization recommendations

