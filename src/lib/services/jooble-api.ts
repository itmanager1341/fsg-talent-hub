/**
 * Jooble API Client
 * 
 * Jooble API documentation: https://jooble.org/api/about
 * Free tier: 1,000 requests/day
 */

export interface JoobleJob {
  title: string;
  location: string;
  snippet: string;
  salary: string;
  source: string;
  type: string;
  link: string;
  updated: string;
  id: string;
}

export interface JoobleSearchParams {
  keywords?: string;
  location?: string;
  radius?: number; // km
  page?: number;
  searchMode?: number; // 1 = all words, 2 = any word
  datefrom?: string; // YYYY-MM-DD
  dateTo?: string; // YYYY-MM-DD
}

export interface JoobleResponse {
  totalCount: number;
  jobs: JoobleJob[];
}

/**
 * Fetch jobs from Jooble API
 */
export async function fetchJoobleJobs(
  apiKey: string,
  params: JoobleSearchParams = {}
): Promise<JoobleJob[]> {
  const baseUrl = 'https://jooble.org/api/';
  const searchParams = {
    keywords: params.keywords || '',
    location: params.location || '',
    radius: params.radius || 25,
    page: params.page || 1,
    searchMode: params.searchMode || 1,
    ...(params.datefrom && { datefrom: params.datefrom }),
    ...(params.dateTo && { dateTo: params.dateTo }),
  };

  try {
    const response = await fetch(`${baseUrl}${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchParams),
    });

    if (!response.ok) {
      throw new Error(`Jooble API error: ${response.status} ${response.statusText}`);
    }

    const data: JoobleResponse = await response.json();
    return data.jobs || [];
  } catch (error) {
    console.error('Error fetching Jooble jobs:', error);
    throw error;
  }
}

/**
 * Normalize Jooble job to our external_jobs format
 */
export function normalizeJoobleJob(
  joobleJob: JoobleJob,
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
  // Parse location (format: "City, State" or "City, State, Country")
  const locationParts = joobleJob.location.split(',').map((s) => s.trim());
  const city = locationParts[0];
  const state = locationParts[1];
  const country = locationParts[2] || 'USA';

  // Parse salary
  let salaryMin: number | undefined;
  let salaryMax: number | undefined;
  if (joobleJob.salary) {
    const salaryMatch = joobleJob.salary.match(/\$?([\d,]+)\s*-\s*\$?([\d,]+)/);
    if (salaryMatch) {
      salaryMin = parseInt(salaryMatch[1].replace(/,/g, ''), 10);
      salaryMax = parseInt(salaryMatch[2].replace(/,/g, ''), 10);
    } else {
      const singleMatch = joobleJob.salary.match(/\$?([\d,]+)/);
      if (singleMatch) {
        salaryMin = parseInt(singleMatch[1].replace(/,/g, ''), 10);
      }
    }
  }

  // Determine work setting
  let workSetting: string | undefined;
  const locationLower = joobleJob.location.toLowerCase();
  const snippetLower = joobleJob.snippet.toLowerCase();
  if (locationLower.includes('remote') || snippetLower.includes('remote') || snippetLower.includes('work from home')) {
    workSetting = 'remote';
  } else if (locationLower.includes('hybrid') || snippetLower.includes('hybrid')) {
    workSetting = 'hybrid';
  } else {
    workSetting = 'onsite';
  }

  // Map job type
  let jobType: string | undefined;
  if (joobleJob.type) {
    const typeLower = joobleJob.type.toLowerCase();
    if (typeLower.includes('full')) {
      jobType = 'full_time';
    } else if (typeLower.includes('part')) {
      jobType = 'part_time';
    } else if (typeLower.includes('contract')) {
      jobType = 'contract';
    } else if (typeLower.includes('intern')) {
      jobType = 'internship';
    }
  }

  // Extract company name from source or snippet
  let companyName: string | undefined;
  if (joobleJob.source) {
    companyName = joobleJob.source;
  } else {
    // Try to extract from snippet
    const companyMatch = joobleJob.snippet.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+is looking/);
    if (companyMatch) {
      companyName = companyMatch[1];
    }
  }

  // Calculate expiration (30 days from posting)
  const postedDate = new Date(joobleJob.updated);
  const expiresAt = new Date(postedDate);
  expiresAt.setDate(expiresAt.getDate() + 30);

  return {
    external_id: joobleJob.id,
    source_url: joobleJob.link,
    title: joobleJob.title,
    description: joobleJob.snippet,
    company_name: companyName,
    company_url: undefined,
    location_city: city,
    location_state: state,
    location_country: country,
    salary_min: salaryMin,
    salary_max: salaryMax,
    job_type: jobType,
    work_setting: workSetting,
    experience_level: undefined, // Jooble doesn't provide this
    raw_data: {
      ...joobleJob,
      normalized_at: new Date().toISOString(),
    },
    expires_at: expiresAt.toISOString(),
  };
}

/**
 * Get default search parameters for financial services jobs
 */
export function getDefaultJoobleSearchParams(): JoobleSearchParams {
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - 7);
  
  return {
    keywords: 'mortgage servicing OR financial services OR M&A',
    location: '',
    radius: 25,
    page: 1,
    searchMode: 1,
    datefrom: dateFrom.toISOString().split('T')[0],
  };
}

