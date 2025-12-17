/**
 * Indeed API Client
 * 
 * Indeed Publisher API documentation: https://ads.indeed.com/jobroll/xmlfeed
 * RSS Feed documentation: https://www.indeed.com/rss
 */

export interface IndeedJob {
  jobkey: string;
  jobtitle: string;
  company: string;
  city?: string;
  state?: string;
  country?: string;
  formattedLocation?: string;
  source: string;
  date: string;
  snippet?: string;
  url: string;
  onmousedown?: string;
  latitude?: number;
  longitude?: number;
  jobUrl?: string;
  sponsored?: boolean;
  expired?: boolean;
  indeedApply?: boolean;
  formattedLocationFull?: string;
  formattedRelativeTime?: string;
  salary?: string;
}

export interface IndeedSearchParams {
  query?: string;
  location?: string;
  radius?: number;
  start?: number;
  limit?: number;
  sort?: 'date' | 'relevance';
  fromage?: number; // Days back to search
  jobType?: 'fulltime' | 'parttime' | 'contract' | 'internship' | 'temporary';
  salary?: string; // e.g., "50000-100000"
}

/**
 * Fetch jobs from Indeed Publisher API
 * Note: Requires Indeed Publisher account and API credentials
 */
export async function fetchIndeedJobs(
  publisherId: string,
  params: IndeedSearchParams = {}
): Promise<IndeedJob[]> {
  const baseUrl = 'https://ads.indeed.com/jobroll/xmlfeed';
  const searchParams = new URLSearchParams({
    p: publisherId,
    q: params.query || '',
    l: params.location || '',
    radius: params.radius?.toString() || '25',
    start: params.start?.toString() || '0',
    limit: params.limit?.toString() || '25',
    sort: params.sort || 'date',
    fromage: params.fromage?.toString() || '7',
    ...(params.jobType && { jt: params.jobType }),
    ...(params.salary && { salary: params.salary }),
  });

  try {
    const response = await fetch(`${baseUrl}?${searchParams.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Indeed API error: ${response.status} ${response.statusText}`);
    }

    const xmlText = await response.text();
    return parseIndeedXML(xmlText);
  } catch (error) {
    console.error('Error fetching Indeed jobs:', error);
    throw error;
  }
}

/**
 * Parse Indeed XML response
 * Uses regex-based parsing for server-side compatibility
 */
function parseIndeedXML(xmlText: string): IndeedJob[] {
  const jobs: IndeedJob[] = [];
  
  // Extract all <item> blocks
  const itemMatches = xmlText.matchAll(/<item>([\s\S]*?)<\/item>/g);
  
  for (const match of itemMatches) {
    const itemXml = match[1];
    
    const job: IndeedJob = {
      jobkey: extractXMLValue(itemXml, 'jobkey') || '',
      jobtitle: extractXMLValue(itemXml, 'title') || '',
      company: extractXMLValue(itemXml, 'company') || '',
      city: extractXMLValue(itemXml, 'city'),
      state: extractXMLValue(itemXml, 'state'),
      country: extractXMLValue(itemXml, 'country') || 'USA',
      formattedLocation: extractXMLValue(itemXml, 'formattedLocation'),
      source: extractXMLValue(itemXml, 'source') || 'indeed',
      date: extractXMLValue(itemXml, 'date') || new Date().toISOString(),
      snippet: extractXMLValue(itemXml, 'snippet'),
      url: extractXMLValue(itemXml, 'link') || extractXMLValue(itemXml, 'url') || '',
      salary: extractXMLValue(itemXml, 'salary'),
    };
    
    jobs.push(job);
  }
  
  return jobs;
}

/**
 * Extract value from XML using regex (server-side compatible)
 */
function extractXMLValue(xml: string, tagName: string): string | undefined {
  // Try CDATA first: <tag><![CDATA[value]]></tag>
  const cdataMatch = xml.match(new RegExp(`<${tagName}><!\\[CDATA\\[(.*?)\\]\\]></${tagName}>`, 'i'));
  if (cdataMatch) {
    return cdataMatch[1].trim();
  }
  
  // Try regular: <tag>value</tag>
  const regularMatch = xml.match(new RegExp(`<${tagName}>(.*?)</${tagName}>`, 'i'));
  if (regularMatch) {
    return regularMatch[1].trim();
  }
  
  return undefined;
}

/**
 * Fetch jobs from Indeed RSS feed (fallback method)
 * RSS URL format: https://www.indeed.com/rss?q={query}&l={location}
 */
export async function fetchIndeedRSS(
  params: IndeedSearchParams = {}
): Promise<IndeedJob[]> {
  const baseUrl = 'https://www.indeed.com/rss';
  const searchParams = new URLSearchParams({
    q: params.query || '',
    l: params.location || '',
    radius: params.radius?.toString() || '25',
    ...(params.jobType && { jt: params.jobType }),
    ...(params.salary && { salary: params.salary }),
  });

  try {
    const response = await fetch(`${baseUrl}?${searchParams.toString()}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FSG Talent Hub Job Aggregator)',
      },
    });

    if (!response.ok) {
      throw new Error(`Indeed RSS error: ${response.status} ${response.statusText}`);
    }

    const xmlText = await response.text();
    return parseIndeedRSS(xmlText);
  } catch (error) {
    console.error('Error fetching Indeed RSS:', error);
    throw error;
  }
}

/**
 * Parse Indeed RSS feed
 * Uses regex-based parsing for server-side compatibility
 */
function parseIndeedRSS(xmlText: string): IndeedJob[] {
  const jobs: IndeedJob[] = [];
  
  // Extract all <item> blocks
  const itemMatches = xmlText.matchAll(/<item>([\s\S]*?)<\/item>/g);
  
  for (const match of itemMatches) {
    const itemXml = match[1];
    
    const title = extractXMLValue(itemXml, 'title') || '';
    const link = extractXMLValue(itemXml, 'link') || '';
    const description = extractXMLValue(itemXml, 'description') || '';
    const pubDate = extractXMLValue(itemXml, 'pubDate') || new Date().toISOString();
    
    // Extract job key from URL
    const jobKeyMatch = link.match(/jk=([^&]+)/);
    const jobkey = jobKeyMatch ? jobKeyMatch[1] : crypto.randomUUID();
    
    // Parse title for company (format: "Job Title - Company Name")
    const titleParts = title.split(' - ');
    const jobtitle = titleParts[0] || title;
    const company = titleParts[1] || 'Unknown';
    
    // Extract location from description or title
    const locationMatch = description.match(/([^,]+),\s*([A-Z]{2})/);
    
    const job: IndeedJob = {
      jobkey,
      jobtitle,
      company,
      city: locationMatch ? locationMatch[1].trim() : undefined,
      state: locationMatch ? locationMatch[2] : undefined,
      country: 'USA',
      source: 'indeed',
      date: pubDate,
      snippet: description,
      url: link,
    };
    
    jobs.push(job);
  }
  
  return jobs;
}

/**
 * Extract value from XML using regex (server-side compatible)
 */
function extractXMLValue(xml: string, tagName: string): string | undefined {
  // Try CDATA first: <tag><![CDATA[value]]></tag>
  const cdataMatch = xml.match(new RegExp(`<${tagName}><!\\[CDATA\\[(.*?)\\]\\]></${tagName}>`, 'i'));
  if (cdataMatch) {
    return cdataMatch[1].trim();
  }
  
  // Try regular: <tag>value</tag>
  const regularMatch = xml.match(new RegExp(`<${tagName}>(.*?)</${tagName}>`, 'i'));
  if (regularMatch) {
    return regularMatch[1].trim();
  }
  
  return undefined;
}

/**
 * Normalize Indeed job to our external_jobs format
 */
export function normalizeIndeedJob(
  indeedJob: IndeedJob,
  sourceId: string
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
  // Parse salary if available
  let salaryMin: number | undefined;
  let salaryMax: number | undefined;
  
  if (indeedJob.salary) {
    const salaryMatch = indeedJob.salary.match(/\$?([\d,]+)\s*-\s*\$?([\d,]+)/);
    if (salaryMatch) {
      salaryMin = parseInt(salaryMatch[1].replace(/,/g, ''), 10);
      salaryMax = parseInt(salaryMatch[2].replace(/,/g, ''), 10);
    } else {
      const singleMatch = indeedJob.salary.match(/\$?([\d,]+)/);
      if (singleMatch) {
        salaryMin = parseInt(singleMatch[1].replace(/,/g, ''), 10);
      }
    }
  }

  // Determine work setting from location
  let workSetting: string | undefined;
  if (!indeedJob.city && !indeedJob.state) {
    workSetting = 'remote';
  } else if (indeedJob.formattedLocation?.toLowerCase().includes('remote')) {
    workSetting = 'remote';
  } else {
    workSetting = 'onsite';
  }

  // Extract company URL if available in snippet
  let companyUrl: string | undefined;
  if (indeedJob.snippet) {
    const urlMatch = indeedJob.snippet.match(/https?:\/\/[^\s]+/);
    if (urlMatch) {
      companyUrl = urlMatch[0];
    }
  }

  // Calculate expiration (default 30 days from posting)
  const postedDate = new Date(indeedJob.date);
  const expiresAt = new Date(postedDate);
  expiresAt.setDate(expiresAt.getDate() + 30);

  return {
    external_id: indeedJob.jobkey,
    source_url: indeedJob.url || `https://www.indeed.com/viewjob?jk=${indeedJob.jobkey}`,
    title: indeedJob.jobtitle,
    description: indeedJob.snippet,
    company_name: indeedJob.company,
    company_url: companyUrl,
    location_city: indeedJob.city,
    location_state: indeedJob.state,
    location_country: indeedJob.country || 'USA',
    salary_min: salaryMin,
    salary_max: salaryMax,
    job_type: undefined, // Indeed doesn't provide this in basic feed
    work_setting: workSetting,
    experience_level: undefined, // Would need to parse from description
    raw_data: {
      ...indeedJob,
      normalized_at: new Date().toISOString(),
    },
    expires_at: expiresAt.toISOString(),
  };
}

