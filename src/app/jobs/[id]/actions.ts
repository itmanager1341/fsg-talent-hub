'use server';

import { createClient } from '@/lib/supabase/server';

export interface SimilarJob {
  id: string;
  title: string;
  company_name: string | null;
  similarity: number;
}

export async function getSimilarJobs(jobId: string): Promise<SimilarJob[]> {
  try {
    const supabase = await createClient();

    // First check if the job has an embedding
    const { data: job } = await supabase
      .from('jobs')
      .select('embedding')
      .eq('id', jobId)
      .single();

    if (!job?.embedding) {
      // No embedding yet, return empty array
      return [];
    }

    // Use the database function to get similar jobs
    const { data, error } = await supabase.rpc('get_similar_jobs', {
      target_job_id: jobId,
      match_count: 5,
    });

    if (error) {
      console.error('Error fetching similar jobs:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Get company names for the similar jobs
    const jobIds = data.map((j: { id: string }) => j.id);
    const { data: jobsWithCompanies } = await supabase
      .from('jobs')
      .select('id, company:companies(name)')
      .in('id', jobIds);

    const companyMap = new Map<string, string | null>();
    (jobsWithCompanies || []).forEach((j) => {
      const company = Array.isArray(j.company) ? j.company[0] : j.company;
      companyMap.set(j.id, company?.name || null);
    });

    return data.map((job: { id: string; title: string; similarity: number }) => ({
      id: job.id,
      title: job.title,
      company_name: companyMap.get(job.id) || null,
      similarity: Math.round(job.similarity * 100),
    }));
  } catch (error) {
    console.error('Error in getSimilarJobs:', error);
    return [];
  }
}

export async function triggerEmbeddingGeneration(
  entityType: 'job' | 'candidate',
  entityId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-embedding`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entity_type: entityType,
          entity_id: entityId,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to generate embedding' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error triggering embedding:', error);
    return { success: false, error: 'Failed to generate embedding' };
  }
}
