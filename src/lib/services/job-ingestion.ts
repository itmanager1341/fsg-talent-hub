import { createClient } from '@/lib/supabase/server';

export interface ExternalJob {
  id: string;
  source_id: string;
  external_id: string;
  source_url: string;
  title: string;
  description: string | null;
  company_name: string | null;
  company_url: string | null;
  location_city: string | null;
  location_state: string | null;
  location_country: string;
  salary_min: number | null;
  salary_max: number | null;
  job_type: string | null;
  work_setting: string | null;
  experience_level: string | null;
  matched_company_id: string | null;
  match_confidence: number | null;
  match_method: string | null;
  status: 'pending' | 'matched' | 'imported' | 'duplicate' | 'rejected';
  processing_notes: string | null;
  raw_data: Record<string, unknown> | null;
  first_seen_at: string;
  last_seen_at: string;
  expires_at: string | null;
}

export interface JobIngestionResult {
  jobs_found: number;
  jobs_new: number;
  jobs_updated: number;
  jobs_duplicates: number;
  errors: string[];
}

/**
 * Store external jobs from a source
 */
export async function storeExternalJobs(
  sourceId: string,
  jobs: Array<{
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
    raw_data?: Record<string, unknown>;
    expires_at?: string;
  }>
): Promise<JobIngestionResult> {
  const supabase = await createClient();
  const result: JobIngestionResult = {
    jobs_found: jobs.length,
    jobs_new: 0,
    jobs_updated: 0,
    jobs_duplicates: 0,
    errors: [],
  };

  for (const job of jobs) {
    try {
      // Check if job already exists
      const { data: existing } = await supabase
        .from('external_jobs')
        .select('id')
        .eq('source_id', sourceId)
        .eq('external_id', job.external_id)
        .single();

      if (existing) {
        // Update existing job
        const { error: updateError } = await supabase
          .from('external_jobs')
          .update({
            title: job.title,
            description: job.description ?? null,
            company_name: job.company_name ?? null,
            company_url: job.company_url ?? null,
            location_city: job.location_city ?? null,
            location_state: job.location_state ?? null,
            location_country: job.location_country ?? 'USA',
            salary_min: job.salary_min ?? null,
            salary_max: job.salary_max ?? null,
            job_type: job.job_type ?? null,
            work_setting: job.work_setting ?? null,
            experience_level: job.experience_level ?? null,
            raw_data: job.raw_data ?? null,
            last_seen_at: new Date().toISOString(),
            expires_at: job.expires_at ?? null,
          })
          .eq('id', existing.id);

        if (updateError) {
          result.errors.push(`Failed to update job ${job.external_id}: ${updateError.message}`);
        } else {
          result.jobs_updated++;
        }
      } else {
        // Insert new job
        const { error: insertError } = await supabase
          .from('external_jobs')
          .insert({
            source_id: sourceId,
            external_id: job.external_id,
            source_url: job.source_url,
            title: job.title,
            description: job.description ?? null,
            company_name: job.company_name ?? null,
            company_url: job.company_url ?? null,
            location_city: job.location_city ?? null,
            location_state: job.location_state ?? null,
            location_country: job.location_country ?? 'USA',
            salary_min: job.salary_min ?? null,
            salary_max: job.salary_max ?? null,
            job_type: job.job_type ?? null,
            work_setting: job.work_setting ?? null,
            experience_level: job.experience_level ?? null,
            raw_data: job.raw_data ?? null,
            status: 'pending',
            expires_at: job.expires_at ?? null,
          });

        if (insertError) {
          // Check if it's a duplicate constraint violation
          if (insertError.code === '23505') {
            result.jobs_duplicates++;
          } else {
            result.errors.push(`Failed to insert job ${job.external_id}: ${insertError.message}`);
          }
        } else {
          result.jobs_new++;
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(`Error processing job ${job.external_id}: ${errorMessage}`);
    }
  }

  return result;
}

/**
 * Get external jobs by status
 */
export async function getExternalJobsByStatus(
  status: ExternalJob['status'],
  limit = 50
): Promise<ExternalJob[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('external_jobs')
    .select('*')
    .eq('status', status)
    .order('first_seen_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching external jobs:', error);
    throw new Error('Failed to fetch external jobs');
  }

  return (data || []) as ExternalJob[];
}

