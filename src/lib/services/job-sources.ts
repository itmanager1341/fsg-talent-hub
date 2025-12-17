import { createClient } from '@/lib/supabase/server';

export interface JobSource {
  id: string;
  name: string;
  source_type: 'api' | 'rss' | 'scraper' | 'partner';
  is_active: boolean;
  config: Record<string, unknown>;
  rate_limit_per_hour: number | null;
  last_synced_at: string | null;
  sync_frequency: 'hourly' | 'daily' | 'realtime';
  created_at: string;
  updated_at: string;
}

export interface JobSourceConfig {
  name: string;
  source_type: 'api' | 'rss' | 'scraper' | 'partner';
  is_active?: boolean;
  config?: Record<string, unknown>;
  rate_limit_per_hour?: number;
  sync_frequency?: 'hourly' | 'daily' | 'realtime';
}

/**
 * Get all job sources
 */
export async function getJobSources(): Promise<JobSource[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('job_sources')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching job sources:', error);
    throw new Error('Failed to fetch job sources');
  }

  return (data || []) as JobSource[];
}

/**
 * Get a single job source by ID
 */
export async function getJobSourceById(id: string): Promise<JobSource | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('job_sources')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    console.error('Error fetching job source:', error);
    throw new Error('Failed to fetch job source');
  }

  return data as JobSource;
}

/**
 * Create a new job source
 */
export async function createJobSource(
  config: JobSourceConfig
): Promise<JobSource> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('job_sources')
    .insert({
      name: config.name,
      source_type: config.source_type,
      is_active: config.is_active ?? true,
      config: config.config ?? {},
      rate_limit_per_hour: config.rate_limit_per_hour ?? null,
      sync_frequency: config.sync_frequency ?? 'hourly',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating job source:', error);
    throw new Error('Failed to create job source');
  }

  return data as JobSource;
}

/**
 * Update a job source
 */
export async function updateJobSource(
  id: string,
  updates: Partial<JobSourceConfig>
): Promise<JobSource> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('job_sources')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating job source:', error);
    throw new Error('Failed to update job source');
  }

  return data as JobSource;
}

/**
 * Toggle job source active status
 */
export async function toggleJobSourceActive(
  id: string,
  isActive: boolean
): Promise<void> {
  await updateJobSource(id, { is_active: isActive });
}

/**
 * Delete a job source
 */
export async function deleteJobSource(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('job_sources').delete().eq('id', id);

  if (error) {
    console.error('Error deleting job source:', error);
    throw new Error('Failed to delete job source');
  }
}

