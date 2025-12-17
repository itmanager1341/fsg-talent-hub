'use server';

import { requireAdmin } from '@/lib/auth/requireAuth';
import {
  getPendingJobImports,
  importExternalJob,
  updateJobImportStatus,
} from '@/lib/services/job-import';
import type { ExternalJob } from '@/lib/services/job-ingestion';
import { createClient } from '@/lib/supabase/server';
import { processEmployerProspects } from '@/lib/services/employer-prospecting';

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
      id: importRecord?.id || '',
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
    throw new Error('External job not found');
  }

  try {
    // Import the job
    const jobId = await importExternalJob(
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
      await updateJobImportStatus(existingImport.id, 'imported', jobId);
    } else {
      await supabase.from('job_imports').insert({
        external_job_id: externalJobId,
        company_id: externalJob.matched_company_id,
        status: 'imported',
        import_method: 'manual_review',
        imported_job_id: jobId,
        processed_at: new Date().toISOString(),
      });
    }

    // Process employer prospects for unmatched companies
    if (!externalJob.matched_company_id && externalJob.company_name) {
      try {
        await processEmployerProspects([externalJobId]);
      } catch (error) {
        console.error('Error processing employer prospects:', error);
        // Don't fail the import if prospecting fails
      }
    }

    return { success: true, jobId };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to import job: ${errorMessage}`);
  }
}

/**
 * Reject a job import
 */
export async function rejectImportAction(externalJobId: string, reason?: string) {
  await requireAdmin();
  const supabase = await createClient();

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
}

