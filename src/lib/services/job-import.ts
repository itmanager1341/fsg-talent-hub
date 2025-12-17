import { createClient } from '@/lib/supabase/server';
import type { ExternalJob } from './job-ingestion';

export interface JobImport {
  id: string;
  external_job_id: string;
  company_id: string | null;
  status: 'pending' | 'importing' | 'imported' | 'failed';
  import_method: 'auto' | 'manual_review' | 'employer_approval' | null;
  imported_job_id: string | null;
  error_message: string | null;
  created_at: string;
  processed_at: string | null;
}

/**
 * Create a job import record
 */
export async function createJobImport(
  externalJobId: string,
  companyId: string | null,
  importMethod: 'auto' | 'manual_review' | 'employer_approval' = 'manual_review'
): Promise<JobImport> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('job_imports')
    .insert({
      external_job_id: externalJobId,
      company_id: companyId,
      status: 'pending',
      import_method: importMethod,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating job import:', error);
    throw new Error('Failed to create job import');
  }

  return data as JobImport;
}

/**
 * Import external job into jobs table
 */
export async function importExternalJob(
  externalJob: ExternalJob,
  companyId: string | null
): Promise<string> {
  const supabase = await createClient();

  // Map external job fields to jobs table fields
  const jobData = {
    company_id: companyId,
    title: externalJob.title,
    slug: generateSlug(externalJob.title),
    description: externalJob.description || '',
    location_city: externalJob.location_city,
    location_state: externalJob.location_state,
    location_country: externalJob.location_country || 'USA',
    salary_min: externalJob.salary_min,
    salary_max: externalJob.salary_max,
    work_setting: mapWorkSetting(externalJob.work_setting),
    job_type: mapJobType(externalJob.job_type),
    experience_level: mapExperienceLevel(externalJob.experience_level),
    status: 'active' as const,
    published_at: new Date().toISOString(),
    source_id: externalJob.source_id,
    external_job_id: externalJob.id,
    is_external: true,
    external_url: externalJob.source_url,
  };

  const { data, error } = await supabase
    .from('jobs')
    .insert(jobData)
    .select('id')
    .single();

  if (error) {
    console.error('Error importing job:', error);
    throw new Error(`Failed to import job: ${error.message}`);
  }

  // Update external job status
  await supabase
    .from('external_jobs')
    .update({ status: 'imported' })
    .eq('id', externalJob.id);

  return data.id;
}

/**
 * Get pending job imports
 */
export async function getPendingJobImports(
  limit = 50
): Promise<Array<JobImport & { external_job: ExternalJob }>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('job_imports')
    .select(
      `
      *,
      external_job:external_jobs(*)
    `
    )
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching pending imports:', error);
    throw new Error('Failed to fetch pending imports');
  }

  return (data || []).map((item) => ({
    ...item,
    external_job: item.external_job as ExternalJob,
  })) as Array<JobImport & { external_job: ExternalJob }>;
}

/**
 * Update job import status
 */
export async function updateJobImportStatus(
  importId: string,
  status: JobImport['status'],
  importedJobId?: string,
  errorMessage?: string
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('job_imports')
    .update({
      status,
      imported_job_id: importedJobId ?? null,
      error_message: errorMessage ?? null,
      processed_at: status === 'imported' || status === 'failed' ? new Date().toISOString() : null,
    })
    .eq('id', importId);

  if (error) {
    console.error('Error updating job import:', error);
    throw new Error('Failed to update job import');
  }
}

/**
 * Generate slug from title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Map external work_setting to our enum
 */
function mapWorkSetting(
  workSetting: string | null
): 'onsite' | 'remote' | 'hybrid' {
  if (!workSetting) return 'onsite';
  const lower = workSetting.toLowerCase();
  if (lower.includes('remote')) return 'remote';
  if (lower.includes('hybrid')) return 'hybrid';
  return 'onsite';
}

/**
 * Map external job_type to our enum
 */
function mapJobType(
  jobType: string | null
): 'full_time' | 'part_time' | 'contract' | 'internship' | 'temporary' {
  if (!jobType) return 'full_time';
  const lower = jobType.toLowerCase();
  if (lower.includes('part')) return 'part_time';
  if (lower.includes('contract')) return 'contract';
  if (lower.includes('intern')) return 'internship';
  if (lower.includes('temp')) return 'temporary';
  return 'full_time';
}

/**
 * Map external experience_level to our enum
 */
function mapExperienceLevel(
  experienceLevel: string | null
): 'entry' | 'mid' | 'senior' | 'lead' | 'executive' | null {
  if (!experienceLevel) return null;
  const lower = experienceLevel.toLowerCase();
  if (lower.includes('executive') || lower.includes('c-level')) return 'executive';
  if (lower.includes('lead') || lower.includes('principal')) return 'lead';
  if (lower.includes('senior')) return 'senior';
  if (lower.includes('entry') || lower.includes('junior')) return 'entry';
  return 'mid';
}

