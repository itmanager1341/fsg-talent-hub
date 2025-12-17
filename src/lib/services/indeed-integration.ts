/**
 * Indeed Integration Service
 * 
 * Orchestrates Indeed job fetching, normalization, duplicate detection, and company matching
 */

import {
  fetchIndeedJobs,
  fetchIndeedRSS,
  normalizeIndeedJob,
  type IndeedSearchParams,
} from './indeed-api';
import { storeExternalJobs } from './job-ingestion';
import { matchCompany, updateExternalJobMatch } from './company-matching';
import { checkDuplicate } from './duplicate-detection';
import {
  normalizeJobTitle,
  normalizeCompanyName,
  parseSalary,
  extractWorkSetting,
  extractExperienceLevel,
  extractJobType,
  normalizeDescription,
} from './job-normalization';

export interface IndeedSyncResult {
  jobs_found: number;
  jobs_new: number;
  jobs_updated: number;
  jobs_duplicates: number;
  jobs_matched: number;
  errors: string[];
}

/**
 * Sync jobs from Indeed for a given source
 */
export async function syncIndeedJobs(
  sourceId: string,
  config: {
    publisherId?: string;
    useRSS?: boolean;
    searchParams?: IndeedSearchParams;
  }
): Promise<IndeedSyncResult> {
  const result: IndeedSyncResult = {
    jobs_found: 0,
    jobs_new: 0,
    jobs_updated: 0,
    jobs_duplicates: 0,
    jobs_matched: 0,
    errors: [],
  };

  try {
    // Fetch jobs from Indeed
    let indeedJobs;
    
    if (config.useRSS || !config.publisherId) {
      // Use RSS feed (free, no API key required)
      indeedJobs = await fetchIndeedRSS(config.searchParams || {});
    } else {
      // Use Publisher API
      indeedJobs = await fetchIndeedJobs(config.publisherId, config.searchParams);
    }

    result.jobs_found = indeedJobs.length;

    // Normalize and process each job
    const normalizedJobs = [];
    
    for (const indeedJob of indeedJobs) {
      try {
        // Normalize Indeed job to our format
        const normalized = normalizeIndeedJob(indeedJob, sourceId);
        
        // Apply additional normalization
        const enhanced = {
          ...normalized,
          title: normalizeJobTitle(normalized.title),
          company_name: normalizeCompanyName(normalized.company_name),
          description: normalizeDescription(normalized.description),
        };

        // Extract additional fields from description if needed
        if (normalized.description) {
          if (!enhanced.work_setting) {
            enhanced.work_setting = extractWorkSetting(
              normalized.description,
              normalized.location_city,
              normalized.location_state
            );
          }
          
          if (!enhanced.experience_level) {
            enhanced.experience_level = extractExperienceLevel(normalized.description);
          }
          
          if (!enhanced.job_type) {
            enhanced.job_type = extractJobType(normalized.description);
          }

          // Parse salary from description if not already parsed
          if (!enhanced.salary_min && !enhanced.salary_max) {
            const salary = parseSalary(normalized.description);
            if (salary.min) enhanced.salary_min = salary.min;
            if (salary.max) enhanced.salary_max = salary.max;
          }
        }

        normalizedJobs.push(enhanced);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`Normalization error for job ${indeedJob.jobkey}: ${errorMessage}`);
      }
    }

    // Store jobs in database
    const ingestionResult = await storeExternalJobs(sourceId, normalizedJobs);
    result.jobs_new = ingestionResult.jobs_new;
    result.jobs_updated = ingestionResult.jobs_updated;
    result.jobs_duplicates += ingestionResult.jobs_duplicates;
    result.errors.push(...ingestionResult.errors);

    // Process each stored job: duplicate detection and company matching
    for (const normalized of normalizedJobs) {
      try {
        // Check for duplicates
        const duplicateCheck = await checkDuplicate(
          sourceId,
          normalized.external_id,
          normalized.title,
          normalized.company_name || null,
          normalized.location_city || null,
          normalized.location_state || null
        );

        if (duplicateCheck.isDuplicate) {
          // Job is a duplicate, skip company matching
          continue;
        }

        // Attempt company matching
        const companyMatch = await matchCompany(
          normalized.company_name || null,
          normalized.company_url || null
        );

        if (companyMatch) {
          // Update external job with match
          // We need to get the external job ID first
          const { data: externalJob } = await (await import('@/lib/supabase/server')).createClient()
            .from('external_jobs')
            .select('id')
            .eq('source_id', sourceId)
            .eq('external_id', normalized.external_id)
            .single();

          if (externalJob) {
            await updateExternalJobMatch(externalJob.id, companyMatch);
            result.jobs_matched++;
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`Processing error for job ${normalized.external_id}: ${errorMessage}`);
      }
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(`Sync error: ${errorMessage}`);
    return result;
  }
}

/**
 * Get default search parameters for financial services jobs
 */
export function getDefaultIndeedSearchParams(): IndeedSearchParams {
  return {
    query: 'mortgage servicing OR M&A advisory OR financial services',
    location: '',
    radius: 25,
    limit: 100,
    sort: 'date',
    fromage: 7, // Last 7 days
  };
}

