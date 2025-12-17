/**
 * RSS Feed Discovery Service
 * 
 * Discovers RSS feeds from company career pages and job boards
 */

import { fetchRSSFeed } from './rss-parser';

export interface DiscoveredFeed {
  url: string;
  title: string;
  description?: string;
  type: 'company_career' | 'job_board' | 'industry_specific' | 'unknown';
  company_name?: string;
  company_url?: string;
  last_checked?: string;
  is_valid?: boolean;
  error?: string;
}

/**
 * Common RSS feed URL patterns for career pages
 */
const CAREER_PAGE_PATTERNS = [
  '/careers/rss',
  '/careers/feed',
  '/jobs/rss',
  '/jobs/feed',
  '/careers/jobs/rss',
  '/careers/jobs/feed',
  '/employment/rss',
  '/employment/feed',
  '/opportunities/rss',
  '/opportunities/feed',
];

/**
 * Discover RSS feed from a company website
 */
export async function discoverCompanyFeed(
  companyUrl: string,
  companyName?: string
): Promise<DiscoveredFeed | null> {
  try {
    // Normalize URL
    let baseUrl = companyUrl;
    if (!baseUrl.startsWith('http')) {
      baseUrl = `https://${baseUrl}`;
    }

    const urlObj = new URL(baseUrl);
    const baseDomain = `${urlObj.protocol}//${urlObj.host}`;

    // Try common RSS feed paths
    for (const pattern of CAREER_PAGE_PATTERNS) {
      try {
        const feedUrl = `${baseDomain}${pattern}`;
        const feed = await fetchRSSFeed(feedUrl);
        
        if (feed.items.length > 0) {
          return {
            url: feedUrl,
            title: feed.title,
            description: feed.description,
            type: 'company_career',
            company_name: companyName,
            company_url: baseUrl,
            is_valid: true,
            last_checked: new Date().toISOString(),
          };
        }
      } catch {
        // Continue to next pattern
        continue;
      }
    }

    // Try to find RSS link in HTML
    try {
      const response = await fetch(baseUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; FSG Talent Hub Job Aggregator)',
        },
      });

      if (response.ok) {
        const html = await response.text();
        
        // Look for RSS feed links
        const rssLinkMatch = html.match(/<link[^>]+type=["']application\/rss\+xml["'][^>]+href=["']([^"']+)["']/i);
        if (rssLinkMatch) {
          let feedUrl = rssLinkMatch[1];
          if (!feedUrl.startsWith('http')) {
            feedUrl = new URL(feedUrl, baseUrl).href;
          }

          const feed = await fetchRSSFeed(feedUrl);
          if (feed.items.length > 0) {
            return {
              url: feedUrl,
              title: feed.title,
              description: feed.description,
              type: 'company_career',
              company_name: companyName,
              company_url: baseUrl,
              is_valid: true,
              last_checked: new Date().toISOString(),
            };
          }
        }
      }
    } catch {
      // HTML parsing failed, continue
    }

    return null;
  } catch (error) {
    console.error('Error discovering feed:', error);
    return null;
  }
}

/**
 * Validate RSS feed URL
 */
export async function validateFeed(feedUrl: string): Promise<{
  is_valid: boolean;
  title?: string;
  item_count?: number;
  error?: string;
  last_updated?: string;
}> {
  try {
    const feed = await fetchRSSFeed(feedUrl);
    
    return {
      is_valid: true,
      title: feed.title,
      item_count: feed.items.length,
      last_updated: feed.lastBuildDate,
    };
  } catch (error) {
    return {
      is_valid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Known industry-specific job board RSS feeds
 */
export const INDUSTRY_RSS_FEEDS: DiscoveredFeed[] = [
  {
    url: 'https://www.efinancialcareers.com/rss',
    title: 'eFinancialCareers',
    type: 'industry_specific',
    is_valid: true,
  },
  {
    url: 'https://www.theladders.com/rss',
    title: 'The Ladders',
    type: 'industry_specific',
    is_valid: true,
  },
];

/**
 * Discover feeds for multiple companies
 */
export async function discoverFeedsForCompanies(
  companies: Array<{ name: string; website?: string | null }>
): Promise<DiscoveredFeed[]> {
  const discoveredFeeds: DiscoveredFeed[] = [];

  for (const company of companies) {
    if (!company.website) continue;

    try {
      const feed = await discoverCompanyFeed(company.website, company.name);
      if (feed) {
        discoveredFeeds.push(feed);
      }
    } catch (error) {
      console.error(`Error discovering feed for ${company.name}:`, error);
    }
  }

  return discoveredFeeds;
}

