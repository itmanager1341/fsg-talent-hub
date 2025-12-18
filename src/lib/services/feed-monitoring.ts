/**
 * RSS Feed Monitoring Service
 * 
 * Monitors feed health, availability, and updates
 */

import { createClient } from '@/lib/supabase/server';
import { validateFeed } from './feed-discovery';

export interface FeedHealth {
  source_id: string;
  source_name: string;
  feed_url: string;
  is_healthy: boolean;
  last_successful_fetch?: string;
  last_failed_fetch?: string;
  consecutive_failures: number;
  average_items_per_fetch: number;
  last_item_count: number;
  last_check: string;
  error_message?: string;
  response_time_ms?: number;
}

/**
 * Check health of an RSS feed source
 */
export async function checkFeedHealth(sourceId: string): Promise<FeedHealth> {
  const supabase = await createClient();

  // Get source configuration
  const { data: source } = await supabase
    .from('job_sources')
    .select('*')
    .eq('id', sourceId)
    .single();

  if (!source) {
    throw new Error('Source not found');
  }

  const config = source.config as Record<string, any>;
  const feedUrl = config.feed_url;

  if (!feedUrl) {
    throw new Error('Feed URL not configured');
  }

  // Get recent sync logs
  const { data: recentSyncs } = await supabase
    .from('job_sync_logs')
    .select('*')
    .eq('source_id', sourceId)
    .order('started_at', { ascending: false })
    .limit(10);

  const successfulSyncs = recentSyncs?.filter((s) => s.status === 'success') || [];
  const failedSyncs = recentSyncs?.filter((s) => s.status === 'failed') || [];

  // Calculate consecutive failures
  let consecutiveFailures = 0;
  if (recentSyncs && recentSyncs.length > 0) {
    for (const sync of recentSyncs) {
      if (sync.status === 'failed') {
        consecutiveFailures++;
      } else {
        break;
      }
    }
  }

  // Calculate average items per fetch
  const totalItems = successfulSyncs.reduce((sum, s) => sum + (s.jobs_found || 0), 0);
  const avgItems = successfulSyncs.length > 0 ? totalItems / successfulSyncs.length : 0;

  // Test feed now
  const startTime = Date.now();
  const validation = await validateFeed(feedUrl);
  const responseTime = Date.now() - startTime;

  const health: FeedHealth = {
    source_id: sourceId,
    source_name: source.name,
    feed_url: feedUrl,
    is_healthy: validation.is_valid && consecutiveFailures < 3,
    last_successful_fetch: successfulSyncs[0]?.completed_at || undefined,
    last_failed_fetch: failedSyncs[0]?.completed_at || undefined,
    consecutive_failures: consecutiveFailures,
    average_items_per_fetch: Math.round(avgItems),
    last_item_count: validation.item_count || 0,
    last_check: new Date().toISOString(),
    error_message: validation.error,
    response_time_ms: responseTime,
  };

  return health;
}

/**
 * Get health status for all RSS feed sources
 */
export async function getAllFeedHealth(): Promise<FeedHealth[]> {
  const supabase = await createClient();

  const { data: sources } = await supabase
    .from('job_sources')
    .select('*')
    .eq('source_type', 'rss')
    .eq('is_active', true);

  if (!sources) {
    return [];
  }

  const healthChecks = await Promise.allSettled(
    sources.map((source) => checkFeedHealth(source.id))
  );

  return healthChecks
    .filter((result) => result.status === 'fulfilled')
    .map((result) => (result as PromiseFulfilledResult<FeedHealth>).value);
}

/**
 * Monitor feed and update source status if unhealthy
 */
export async function monitorFeed(sourceId: string): Promise<void> {
  const supabase = await createClient();

  try {
    const health = await checkFeedHealth(sourceId);

    // If feed is unhealthy (3+ consecutive failures), deactivate source
    if (health.consecutive_failures >= 3) {
      await supabase
        .from('job_sources')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sourceId);
    }
  } catch (error) {
    console.error(`Error monitoring feed ${sourceId}:`, error);
  }
}

