/**
 * Adzuna API Client
 * 
 * Adzuna API documentation: https://developer.adzuna.com/
 * Free tier: 10,000 requests/month
 */

export interface AdzunaJob {
  title: string;
  description: string;
  company: {
    display_name: string;
  };
  location: {
    area?: string[];
    display_name: string;
  };
  salary_min?: number;
  salary_max?: number;
  salary_is_predicted?: string;
  contract_type?: string;
  category: {
    label: string;
    tag: string;
  };
  created: string;
  redirect_url: string;
  id: string;
  adref?: string;
}

export interface AdzunaSearchParams {
  app_id?: string;
  app_key?: string;
  what?: string; // Job title/keywords
  where?: string; // Location
  results_per_page?: number; // 1-50
  page?: number;
  sort_by?: 'date' | 'salary' | 'relevance';
  content_type?: 'job';
  country?: string; // 'us' for USA
  category?: string;
  max_days_old?: number;
}

export interface AdzunaResponse {
  count: number;
  mean: number;
  results: AdzunaJob[];
}

/**
 * Fetch jobs from Adzuna API
 */
export async function fetchAdzunaJobs(
  appId: string,
  appKey: string,
  params: AdzunaSearchParams = {}
): Promise<AdzunaJob[]> {
  const baseUrl = 'https://api.adzuna.com/v1/api/jobs/us/search/1';
  const searchParams = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    what: params.what || '',
    where: params.where || '',
    results_per_page: params.results_per_page?.toString() || '50',
    page: params.page?.toString() || '1',
    sort_by: params.sort_by || 'date',
    content_type: params.content_type || 'job',
    country: params.country || 'us',
    ...(params.category && { category: params.category }),
    ...(params.max_days_old && { max_days_old: params.max_days_old.toString() }),
  });

  try {
    const response = await fetch(`${baseUrl}?${searchParams.toString()}`);

    if (!response.ok) {
      throw new Error(`Adzuna API error: ${response.status} ${response.statusText}`);
    }

    const data: AdzunaResponse = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Error fetching Adzuna jobs:', error);
    throw error;
  }
}

/**
 * Normalize Adzuna job to our external_jobs format
 */
export function normalizeAdzunaJob(
  adzunaJob: AdzunaJob,
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
  // Parse location
  const locationParts = adzunaJob.location.display_name.split(',');
  const city = locationParts[0]?.trim();
  const state = locationParts[1]?.trim();

  // Determine work setting
  let workSetting: string | undefined;
  const locationLower = adzunaJob.location.display_name.toLowerCase();
  if (locationLower.includes('remote') || locationLower.includes('work from home')) {
    workSetting = 'remote';
  } else if (locationLower.includes('hybrid')) {
    workSetting = 'hybrid';
  } else {
    workSetting = 'onsite';
  }

  // Map contract type to our job_type
  let jobType: string | undefined;
  if (adzunaJob.contract_type) {
    const contractLower = adzunaJob.contract_type.toLowerCase();
    if (contractLower.includes('full')) {
      jobType = 'full_time';
    } else if (contractLower.includes('part')) {
      jobType = 'part_time';
    } else if (contractLower.includes('contract')) {
      jobType = 'contract';
    } else if (contractLower.includes('intern')) {
      jobType = 'internship';
    }
  }

  // Calculate expiration (30 days from posting)
  const postedDate = new Date(adzunaJob.created);
  const expiresAt = new Date(postedDate);
  expiresAt.setDate(expiresAt.getDate() + 30);

  return {
    external_id: adzunaJob.id || adzunaJob.adref || crypto.randomUUID(),
    source_url: adzunaJob.redirect_url,
    title: adzunaJob.title,
    description: adzunaJob.description,
    company_name: adzunaJob.company.display_name,
    company_url: undefined,
    location_city: city,
    location_state: state,
    location_country: 'USA',
    salary_min: adzunaJob.salary_min || undefined,
    salary_max: adzunaJob.salary_max || undefined,
    job_type: jobType,
    work_setting: workSetting,
    experience_level: undefined, // Adzuna doesn't provide this
    raw_data: {
      ...adzunaJob,
      normalized_at: new Date().toISOString(),
    },
    expires_at: expiresAt.toISOString(),
  };
}

/**
 * Get default search parameters for financial services jobs
 */
export function getDefaultAdzunaSearchParams(): AdzunaSearchParams {
  return {
    what: 'mortgage servicing OR financial services OR M&A',
    where: '',
    results_per_page: 50,
    sort_by: 'date',
    max_days_old: 7,
  };
}

