'use server';

import { requireAdmin } from '@/lib/auth/requireAuth';
import {
  getPendingJobImports,
  importExternalJob,
  updateJobImportStatus,
  type ImportResult,
} from '@/lib/services/job-import';
import type { ExternalJob } from '@/lib/services/job-ingestion';
import { createClient } from '@/lib/supabase/server';

export interface ImportQueueItem {
  id: string;
  external_job_id: string;
  company_id: string | null;
  status: string;
  import_method: string | null;
  imported_job_id: string | null;
  error_message: string | null;
  created_at: string;
  processed_at: string | null;
  external_job: ExternalJob;
}

/**
 * Get external jobs for import queue
 */
export async function getImportQueue(
  status?: string,
  limit = 50
): Promise<ImportQueueItem[]> {
  await requireAdmin();
  const supabase = await createClient();

  let query = supabase
    .from('external_jobs')
    .select(
      `
      *,
      job_import:job_imports(*)
    `
    )
    .order('first_seen_at', { ascending: false })
    .limit(limit);

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching import queue:', error);
    return [];
  }

  // Transform the data to match ImportQueueItem structure
  return (data || []).map((item) => {
    const importRecord = Array.isArray(item.job_import)
      ? item.job_import[0]
      : item.job_import;

    return {
      id: importRecord?.id || item.id, // Use external_job_id if no import record exists
      external_job_id: item.id,
      company_id: importRecord?.company_id || item.matched_company_id,
      status: importRecord?.status || 'pending',
      import_method: importRecord?.import_method || null,
      imported_job_id: importRecord?.imported_job_id || null,
      error_message: importRecord?.error_message || null,
      created_at: importRecord?.created_at || item.first_seen_at,
      processed_at: importRecord?.processed_at || null,
      external_job: item as ExternalJob,
    };
  }) as ImportQueueItem[];
}

/**
 * Approve and import a job
 * Now creates real company records (not placeholders) and links to employer_prospects
 */
export async function approveImportAction(externalJobId: string) {
  await requireAdmin();
  const supabase = await createClient();

  // Get the external job
  const { data: externalJob, error: fetchError } = await supabase
    .from('external_jobs')
    .select('*')
    .eq('id', externalJobId)
    .single();

  if (fetchError || !externalJob) {
    return { success: false, error: 'External job not found' };
  }

  try {
    // Import the job (creates real company if needed)
    const importResult: ImportResult = await importExternalJob(
      externalJob as ExternalJob,
      externalJob.matched_company_id
    );

    // Update or create import record
    const { data: existingImport } = await supabase
      .from('job_imports')
      .select('id')
      .eq('external_job_id', externalJobId)
      .single();

    if (existingImport) {
      await updateJobImportStatus(existingImport.id, 'imported', importResult.jobId);
    } else {
      await supabase.from('job_imports').insert({
        external_job_id: externalJobId,
        company_id: importResult.companyId,
        status: 'imported',
        import_method: 'manual_review',
        imported_job_id: importResult.jobId,
        processed_at: new Date().toISOString(),
      });
    }

    // If a new company was created, create or update employer prospect (without inline HubSpot call)
    if (importResult.isNewCompany && externalJob.company_name) {
      try {
        await createOrUpdateEmployerProspect(
          supabase,
          externalJob.company_name,
          externalJob.company_url,
          importResult.companyId
        );
      } catch (error) {
        console.error('Error creating employer prospect:', error);
        // Don't fail the import if prospecting fails
      }
    }

    return { success: true, jobId: importResult.jobId, isNewCompany: importResult.isNewCompany };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in approveImportAction:', errorMessage);
    return { success: false, error: `Failed to import job: ${errorMessage}` };
  }
}

/**
 * Create or update an employer prospect linked to the created company
 * HubSpot sync happens in background, not inline
 */
async function createOrUpdateEmployerProspect(
  supabase: Awaited<ReturnType<typeof createClient>>,
  companyName: string,
  companyUrl: string | null,
  createdCompanyId: string
) {
  // Check if prospect already exists for this company
  const { data: existing } = await supabase
    .from('employer_prospects')
    .select('id, job_count')
    .eq('created_company_id', createdCompanyId)
    .single();

  if (existing) {
    // Update existing prospect - increment job count
    await supabase
      .from('employer_prospects')
      .update({
        job_count: (existing.job_count || 0) + 1,
        last_seen_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
  } else {
    // Create new prospect linked to company
    // HubSpot IDs are NULL - will be filled by background sync
    await supabase.from('employer_prospects').insert({
      company_name: companyName,
      company_url: companyUrl,
      created_company_id: createdCompanyId,
      job_count: 1,
      first_seen_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
      enrichment_status: 'pending',
      outreach_status: 'pending',
      // hubspot_company_id: NULL - filled by background sync
      // hubspot_contact_id: NULL - filled by background sync
    });
  }
}

/**
 * Reject a job import
 */
export async function rejectImportAction(
  externalJobId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  const supabase = await createClient();

  try {
    // Update external job status
    await supabase
      .from('external_jobs')
      .update({ status: 'rejected', processing_notes: reason || 'Rejected by admin' })
      .eq('id', externalJobId);

    // Update or create import record
    const { data: existingImport } = await supabase
      .from('job_imports')
      .select('id')
      .eq('external_job_id', externalJobId)
      .single();

    if (existingImport) {
      await updateJobImportStatus(existingImport.id, 'failed', undefined, reason);
    } else {
      await supabase.from('job_imports').insert({
        external_job_id: externalJobId,
        status: 'failed',
        import_method: 'manual_review',
        error_message: reason || 'Rejected by admin',
        processed_at: new Date().toISOString(),
      });
    }

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

