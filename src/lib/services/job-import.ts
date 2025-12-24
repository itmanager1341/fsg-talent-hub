import { createClient } from '@/lib/supabase/server';
import type { ExternalJob } from './job-ingestion';
import { normalizeDescription, normalizeJobTitle } from './job-normalization';

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
 * Generate a unique slug for a company name
 */
function generateCompanySlug(companyName: string): string {
  const baseSlug = companyName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50); // Limit length

  // Add timestamp suffix for uniqueness
  return `${baseSlug}-${Date.now().toString(36)}`;
}

/**
 * Get existing company or create a new unverified company for external job import
 * This creates REAL company records (not placeholders) with is_verified = false
 */
async function getOrCreateCompanyForExternalJob(
  supabase: Awaited<ReturnType<typeof createClient>>,
  companyName: string | null,
  companyUrl: string | null
): Promise<{ companyId: string; isNew: boolean }> {
  if (!companyName) {
    throw new Error('Company name is required to create company record');
  }

  const normalizedName = companyName.trim();

  // 1. Check if company already exists (by exact name match)
  const { data: existing } = await supabase
    .from('companies')
    .select('id')
    .ilike('name', normalizedName)
    .limit(1)
    .single();

  if (existing) {
    return { companyId: existing.id, isNew: false };
  }

  // 2. Create new UNVERIFIED company
  const slug = generateCompanySlug(normalizedName);

  const { data: created, error } = await supabase
    .from('companies')
    .insert({
      name: normalizedName,
      slug,
      website: companyUrl,
      is_verified: false,  // KEY: Unverified until employer signs up
      is_active: true,
      tier: 'free',
      hubspot_sync_status: 'pending', // Will be synced to HubSpot in background
    })
    .select('id')
    .single();

  if (error || !created) {
    console.error('Error creating company:', error);
    throw new Error(`Failed to create company for "${normalizedName}": ${error?.message}`);
  }

  return { companyId: created.id, isNew: true };
}

export interface ImportResult {
  jobId: string;
  companyId: string;
  isNewCompany: boolean;
}

/**
 * Import external job into jobs table
 * Uses regular client - RLS policies allow admins to insert jobs
 * Creates real company records (not placeholders) for unmatched companies
 */
export async function importExternalJob(
  externalJob: ExternalJob,
  companyId: string | null
): Promise<ImportResult> {
  // Use regular client - admin RLS policies allow admins to insert jobs
  const supabase = await createClient();

  // If no company matched, create a real (unverified) company record
  let finalCompanyId: string;
  let isNewCompany = false;

  if (companyId) {
    finalCompanyId = companyId;
  } else if (externalJob.company_name) {
    const result = await getOrCreateCompanyForExternalJob(
      supabase,
      externalJob.company_name,
      externalJob.company_url
    );
    finalCompanyId = result.companyId;
    isNewCompany = result.isNew;
  } else {
    throw new Error('Cannot import job without company name or matched company');
  }

  // Map external job fields to jobs table fields
  // Normalize title and description to clean up HTML entities and tags
  const cleanTitle = normalizeJobTitle(externalJob.title);
  const cleanDescription = normalizeDescription(externalJob.description) || '';

  const jobData = {
    company_id: finalCompanyId,
    title: cleanTitle,
    slug: generateSlug(cleanTitle),
    description: cleanDescription,
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

  // Update external job status and link to matched company
  await supabase
    .from('external_jobs')
    .update({
      status: 'imported',
      matched_company_id: finalCompanyId, // Update the match if we created a new company
    })
    .eq('id', externalJob.id);

  return {
    jobId: data.id,
    companyId: finalCompanyId,
    isNewCompany,
  };
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

