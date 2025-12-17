'use server';

import { requireAdmin } from '@/lib/auth/requireAuth';
import {
  getJobSources,
  getJobSourceById,
  createJobSource,
  updateJobSource,
  toggleJobSourceActive,
  deleteJobSource,
  type JobSourceConfig,
} from '@/lib/services/job-sources';
import { createClient } from '@/lib/supabase/server';

export interface SyncLog {
  id: string;
  source_id: string;
  sync_type: string;
  status: string;
  jobs_found: number;
  jobs_new: number;
  jobs_updated: number;
  jobs_duplicates: number;
  errors: unknown[];
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
}

/**
 * Get all job sources
 */
export async function getAllJobSources() {
  await requireAdmin();
  return await getJobSources();
}

/**
 * Get a single job source by ID
 */
export async function getJobSourceByIdAction(id: string) {
  await requireAdmin();
  return await getJobSourceById(id);
}

/**
 * Get sync logs for a source
 */
export async function getSyncLogs(sourceId?: string, limit = 10): Promise<SyncLog[]> {
  await requireAdmin();
  const supabase = await createClient();

  let query = supabase
    .from('job_sync_logs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(limit);

  if (sourceId) {
    query = query.eq('source_id', sourceId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching sync logs:', error);
    return [];
  }

  return (data || []) as SyncLog[];
}

/**
 * Get overview statistics
 */
export async function getJobSourcesStats() {
  await requireAdmin();
  const supabase = await createClient();

  const [sourcesResult, externalJobsResult, importsResult, todaySyncResult] = await Promise.all([
    supabase.from('job_sources').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase
      .from('external_jobs')
      .select('id', { count: 'exact', head: true })
      .in('status', ['pending', 'matched']),
    supabase
      .from('job_imports')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('external_jobs')
      .select('id', { count: 'exact', head: true })
      .gte('first_seen_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
  ]);

  const matchedResult = await supabase
    .from('external_jobs')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'matched');

  const totalMatched = matchedResult.count || 0;
  const totalExternal = externalJobsResult.count || 0;
  const matchRate = totalExternal > 0 ? Math.round((totalMatched / totalExternal) * 100) : 0;

  return {
    activeSources: sourcesResult.count || 0,
    pendingImports: importsResult.count || 0,
    jobsIngestedToday: todaySyncResult.count || 0,
    matchRate,
  };
}

/**
 * Create a new job source
 */
export async function createSourceAction(config: JobSourceConfig) {
  await requireAdmin();
  return await createJobSource(config);
}

/**
 * Update a job source
 */
export async function updateSourceAction(id: string, updates: Partial<JobSourceConfig>) {
  await requireAdmin();
  return await updateJobSource(id, updates);
}

/**
 * Toggle source active status
 */
export async function toggleSourceActiveAction(id: string, isActive: boolean) {
  await requireAdmin();
  await toggleJobSourceActive(id, isActive);
}

/**
 * Delete a job source
 */
export async function deleteSourceAction(id: string) {
  await requireAdmin();
  await deleteJobSource(id);
}

/**
 * Trigger manual sync for a source
 * Calls the sync-job-source edge function
 */
export async function triggerSyncAction(sourceId: string) {
  await requireAdmin();
  
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Not authenticated');
    }

    // Call edge function
    const { data, error } = await supabase.functions.invoke('sync-job-source', {
      body: { sourceId },
    });

    if (error) {
      throw new Error(`Sync failed: ${error.message}`);
    }

    return { success: true, data };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to trigger sync: ${errorMessage}`);
  }
}

