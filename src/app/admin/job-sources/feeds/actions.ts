'use server';

import { requireAdmin } from '@/lib/auth/requireAuth';
import { discoverCompanyFeed, validateFeed } from '@/lib/services/feed-discovery';
import { createJobSource } from '@/lib/services/job-sources';
import type { JobSourceConfig } from '@/lib/services/job-sources';

/**
 * Discover RSS feed from company URL
 */
export async function discoverFeedAction(companyUrl: string, companyName?: string) {
  await requireAdmin();
  
  try {
    const feed = await discoverCompanyFeed(companyUrl, companyName);
    
    if (!feed) {
      return {
        success: false,
        message: 'No RSS feed found on this website',
      };
    }

    return {
      success: true,
      feed,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      message: `Discovery failed: ${errorMessage}`,
    };
  }
}

/**
 * Validate RSS feed URL
 */
export async function validateFeedAction(feedUrl: string) {
  await requireAdmin();
  
  try {
    const validation = await validateFeed(feedUrl);
    return validation;
  } catch (error) {
    return {
      is_valid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create job source from discovered feed
 */
export async function createSourceFromFeedAction(
  feed: { url: string; title: string; company_name?: string },
  config: Partial<JobSourceConfig> = {}
) {
  await requireAdmin();
  
  try {
    const sourceConfig: JobSourceConfig = {
      name: feed.title || `RSS Feed - ${feed.company_name || 'Unknown'}`,
      source_type: 'rss',
      is_active: true,
      config: {
        feed_url: feed.url,
        ...config.config,
      },
      sync_frequency: config.sync_frequency || 'hourly',
      rate_limit_per_hour: config.rate_limit_per_hour || 10,
    };

    const source = await createJobSource(sourceConfig);
    
    return {
      success: true,
      source,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      message: `Failed to create source: ${errorMessage}`,
    };
  }
}

