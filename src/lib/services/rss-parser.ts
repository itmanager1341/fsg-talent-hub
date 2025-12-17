/**
 * Generic RSS Feed Parser Service
 * 
 * Handles parsing of RSS/Atom feeds from various sources
 */

export interface RSSItem {
  title: string;
  link: string;
  description?: string;
  pubDate?: string;
  guid?: string;
  author?: string;
  category?: string[];
  enclosure?: {
    url: string;
    type: string;
    length?: number;
  };
}

export interface RSSFeed {
  title: string;
  description?: string;
  link?: string;
  language?: string;
  lastBuildDate?: string;
  items: RSSItem[];
}

/**
 * Parse RSS/Atom feed XML
 */
export function parseRSSFeed(xmlText: string): RSSFeed {
  // Detect feed type
  const isAtom = xmlText.includes('<feed') && xmlText.includes('xmlns="http://www.w3.org/2005/Atom"');
  
  if (isAtom) {
    return parseAtomFeed(xmlText);
  } else {
    return parseRSS2Feed(xmlText);
  }
}

/**
 * Parse RSS 2.0 feed
 */
function parseRSS2Feed(xmlText: string): RSSFeed {
  const feed: RSSFeed = {
    title: extractFeedValue(xmlText, 'title') || 'Untitled Feed',
    description: extractFeedValue(xmlText, 'description'),
    link: extractFeedValue(xmlText, 'link'),
    language: extractFeedValue(xmlText, 'language'),
    lastBuildDate: extractFeedValue(xmlText, 'lastBuildDate'),
    items: [],
  };

  // Extract channel items
  const itemMatches = xmlText.matchAll(/<item>([\s\S]*?)<\/item>/g);
  
  for (const match of itemMatches) {
    const itemXml = match[1];
    
    const item: RSSItem = {
      title: extractItemValue(itemXml, 'title') || '',
      link: extractItemValue(itemXml, 'link') || '',
      description: extractItemValue(itemXml, 'description'),
      pubDate: extractItemValue(itemXml, 'pubDate'),
      guid: extractItemValue(itemXml, 'guid'),
      author: extractItemValue(itemXml, 'author') || extractItemValue(itemXml, 'dc:creator'),
      category: extractItemValues(itemXml, 'category'),
    };

    // Extract enclosure if present
    const enclosureMatch = itemXml.match(/<enclosure\s+([^>]+)\/>/);
    if (enclosureMatch) {
      const attrs = enclosureMatch[1];
      const urlMatch = attrs.match(/url=["']([^"']+)["']/);
      const typeMatch = attrs.match(/type=["']([^"']+)["']/);
      const lengthMatch = attrs.match(/length=["']([^"']+)["']/);
      
      if (urlMatch) {
        item.enclosure = {
          url: urlMatch[1],
          type: typeMatch ? typeMatch[1] : '',
          length: lengthMatch ? parseInt(lengthMatch[1], 10) : undefined,
        };
      }
    }

    if (item.title && item.link) {
      feed.items.push(item);
    }
  }

  return feed;
}

/**
 * Parse Atom feed
 */
function parseAtomFeed(xmlText: string): RSSFeed {
  const feed: RSSFeed = {
    title: extractFeedValue(xmlText, 'title') || 'Untitled Feed',
    description: extractFeedValue(xmlText, 'subtitle') || extractFeedValue(xmlText, 'summary'),
    link: extractAtomLink(xmlText),
    lastBuildDate: extractFeedValue(xmlText, 'updated'),
    items: [],
  };

  // Extract entries
  const entryMatches = xmlText.matchAll(/<entry>([\s\S]*?)<\/entry>/g);
  
  for (const match of entryMatches) {
    const entryXml = match[1];
    
    const item: RSSItem = {
      title: extractItemValue(entryXml, 'title') || '',
      link: extractAtomLink(entryXml) || '',
      description: extractItemValue(entryXml, 'summary') || extractItemValue(entryXml, 'content'),
      pubDate: extractItemValue(entryXml, 'published') || extractItemValue(entryXml, 'updated'),
      guid: extractItemValue(entryXml, 'id'),
      author: extractItemValue(entryXml, 'author') || extractItemValue(entryXml, 'name'),
    };

    if (item.title && item.link) {
      feed.items.push(item);
    }
  }

  return feed;
}

/**
 * Extract value from feed-level XML
 */
function extractFeedValue(xml: string, tagName: string): string | undefined {
  // Try CDATA first
  const cdataMatch = xml.match(new RegExp(`<${tagName}><!\\[CDATA\\[(.*?)\\]\\]></${tagName}>`, 'i'));
  if (cdataMatch) {
    return cdataMatch[1].trim();
  }
  
  // Try regular
  const regularMatch = xml.match(new RegExp(`<${tagName}>(.*?)</${tagName}>`, 'i'));
  if (regularMatch) {
    return regularMatch[1].trim();
  }
  
  return undefined;
}

/**
 * Extract value from item-level XML
 */
function extractItemValue(xml: string, tagName: string): string | undefined {
  return extractFeedValue(xml, tagName);
}

/**
 * Extract multiple values (e.g., categories)
 */
function extractItemValues(xml: string, tagName: string): string[] {
  const values: string[] = [];
  const matches = xml.matchAll(new RegExp(`<${tagName}>(.*?)</${tagName}>`, 'gi'));
  
  for (const match of matches) {
    values.push(match[1].trim());
  }
  
  return values;
}

/**
 * Extract Atom link (can be in link href attribute)
 */
function extractAtomLink(xml: string): string | undefined {
  // Try <link href="..."/>
  const linkMatch = xml.match(/<link[^>]+href=["']([^"']+)["']/);
  if (linkMatch) {
    return linkMatch[1];
  }
  
  // Try <link>...</link>
  return extractFeedValue(xml, 'link');
}

/**
 * Fetch and parse RSS feed from URL
 */
export async function fetchRSSFeed(url: string): Promise<RSSFeed> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FSG Talent Hub Job Aggregator)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
    });

    if (!response.ok) {
      throw new Error(`RSS feed fetch failed: ${response.status} ${response.statusText}`);
    }

    const xmlText = await response.text();
    return parseRSSFeed(xmlText);
  } catch (error) {
    console.error('Error fetching RSS feed:', error);
    throw error;
  }
}

/**
 * Normalize RSS item to external_jobs format
 */
export function normalizeRSSItem(
  item: RSSItem,
  sourceId: string,
  feedUrl: string
): {
  external_id: string;
  source_url: string;
  title: string;
  description?: string;
  company_name?: string;
  company_url?: string;
  location_city?: string;
  location_state?: string;
  location_country?: string;
  salary_min?: number;
  salary_max?: number;
  job_type?: string;
  work_setting?: string;
  experience_level?: string;
  raw_data: Record<string, unknown>;
  expires_at?: string;
} {
  // Extract external ID from guid or link
  let externalId = item.guid || '';
  if (!externalId && item.link) {
    // Try to extract ID from URL
    const urlMatch = item.link.match(/\/([^\/]+)\/?$/);
    if (urlMatch) {
      externalId = urlMatch[1];
    } else {
      // Use hash of link as ID
      externalId = Buffer.from(item.link).toString('base64').substring(0, 50);
    }
  }

  // Parse title for company (common format: "Job Title - Company Name")
  let title = item.title;
  let companyName: string | undefined;
  const titleParts = title.split(' - ');
  if (titleParts.length > 1) {
    title = titleParts[0].trim();
    companyName = titleParts.slice(1).join(' - ').trim();
  }

  // Extract location from description
  let locationCity: string | undefined;
  let locationState: string | undefined;
  if (item.description) {
    const locationMatch = item.description.match(/([^,]+),\s*([A-Z]{2})\b/);
    if (locationMatch) {
      locationCity = locationMatch[1].trim();
      locationState = locationMatch[2];
    }
  }

  // Determine work setting
  let workSetting: string | undefined;
  const descriptionLower = (item.description || '').toLowerCase();
  if (descriptionLower.includes('remote') || descriptionLower.includes('work from home')) {
    workSetting = 'remote';
  } else if (descriptionLower.includes('hybrid')) {
    workSetting = 'hybrid';
  } else {
    workSetting = 'onsite';
  }

  // Calculate expiration (30 days from posting)
  const postedDate = item.pubDate ? new Date(item.pubDate) : new Date();
  const expiresAt = new Date(postedDate);
  expiresAt.setDate(expiresAt.getDate() + 30);

  return {
    external_id: externalId,
    source_url: item.link,
    title,
    description: item.description,
    company_name: companyName,
    company_url: undefined,
    location_city: locationCity,
    location_state: locationState,
    location_country: 'USA',
    salary_min: undefined,
    salary_max: undefined,
    job_type: undefined,
    work_setting: workSetting,
    experience_level: undefined,
    raw_data: {
      ...item,
      feed_url: feedUrl,
      normalized_at: new Date().toISOString(),
    },
    expires_at: expiresAt.toISOString(),
  };
}

