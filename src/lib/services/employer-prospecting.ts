import { createClient } from '@/lib/supabase/server';
import type { ExternalJob } from './job-ingestion';

/**
 * Identify potential new employers from external jobs
 * Returns companies that don't exist in our database
 */
export async function identifyNewEmployers(
  externalJobs: ExternalJob[]
): Promise<Array<{ company_name: string; company_url: string | null; job_count: number }>> {
  const supabase = await createClient();

  // Get all unique company names from external jobs
  const companyMap = new Map<string, { url: string | null; count: number }>();

  for (const job of externalJobs) {
    if (job.company_name && !job.matched_company_id) {
      const existing = companyMap.get(job.company_name) || { url: job.company_url, count: 0 };
      companyMap.set(job.company_name, {
        url: existing.url || job.company_url,
        count: existing.count + 1,
      });
    }
  }

  // Check which companies don't exist in our database
  const newEmployers: Array<{ company_name: string; company_url: string | null; job_count: number }> = [];

  for (const [companyName, data] of companyMap.entries()) {
    const { data: existing } = await supabase
      .from('companies')
      .select('id')
      .ilike('name', companyName)
      .limit(1)
      .single();

    if (!existing) {
      newEmployers.push({
        company_name: companyName,
        company_url: data.url,
        job_count: data.count,
      });
    }
  }

  return newEmployers;
}

/**
 * Create HubSpot lead for new employer
 * Note: This is a placeholder - actual HubSpot integration would go here
 */
export async function createHubSpotLead(
  companyName: string,
  companyUrl: string | null,
  jobCount: number
): Promise<void> {
  // TODO: Implement actual HubSpot API integration
  // This would create a company/contact in HubSpot
  console.log('Would create HubSpot lead:', {
    companyName,
    companyUrl,
    jobCount,
  });
}

/**
 * Enrich company data from external sources
 */
export async function enrichCompanyData(
  companyName: string,
  companyUrl: string | null
): Promise<{
  website?: string;
  industry?: string;
  description?: string;
}> {
  // TODO: Implement company data enrichment
  // Could use APIs like Clearbit, FullContact, or similar
  return {
    website: companyUrl || undefined,
  };
}

