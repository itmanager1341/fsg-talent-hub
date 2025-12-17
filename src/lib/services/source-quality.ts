/**
 * Source Quality Scoring Service
 * 
 * Calculates quality scores for job sources based on various metrics
 */

import { createClient } from '@/lib/supabase/server';

export interface SourceQualityMetrics {
  source_id: string;
  source_name: string;
  quality_score: number; // 0-1
  jobs_total: number;
  jobs_matched: number;
  match_rate: number;
  jobs_imported: number;
  import_rate: number;
  avg_completeness: number; // 0-1, how complete job data is
  error_rate: number; // 0-1, percentage of syncs with errors
  last_30_days: {
    jobs_found: number;
    jobs_new: number;
    jobs_duplicates: number;
    syncs_successful: number;
    syncs_failed: number;
  };
}

/**
 * Calculate quality score for a source
 */
export async function calculateSourceQuality(
  sourceId: string
): Promise<SourceQualityMetrics> {
  const supabase = await createClient();

  // Get source info
  const { data: source } = await supabase
    .from('job_sources')
    .select('name')
    .eq('id', sourceId)
    .single();

  if (!source) {
    throw new Error('Source not found');
  }

  // Get external jobs stats
  const { count: totalJobs } = await supabase
    .from('external_jobs')
    .select('id', { count: 'exact', head: true })
    .eq('source_id', sourceId);

  const { count: matchedJobs } = await supabase
    .from('external_jobs')
    .select('id', { count: 'exact', head: true })
    .eq('source_id', sourceId)
    .eq('status', 'matched');

  const { count: importedJobs } = await supabase
    .from('external_jobs')
    .select('id', { count: 'exact', head: true })
    .eq('source_id', sourceId)
    .eq('status', 'imported');

  // Get sync logs for last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: recentSyncs } = await supabase
    .from('job_sync_logs')
    .select('*')
    .eq('source_id', sourceId)
    .gte('started_at', thirtyDaysAgo.toISOString())
    .order('started_at', { ascending: false });

  // Calculate metrics
  const totalJobsCount = totalJobs || 0;
  const matchedJobsCount = matchedJobs || 0;
  const importedJobsCount = importedJobs || 0;
  const matchRate = totalJobsCount > 0 ? matchedJobsCount / totalJobsCount : 0;
  const importRate = totalJobsCount > 0 ? importedJobsCount / totalJobsCount : 0;

  // Calculate average completeness
  const { data: sampleJobs } = await supabase
    .from('external_jobs')
    .select('title, description, company_name, location_city, location_state, salary_min, salary_max')
    .eq('source_id', sourceId)
    .limit(100);

  let avgCompleteness = 0;
  if (sampleJobs && sampleJobs.length > 0) {
    const completenessScores = sampleJobs.map((job) => {
      let score = 0;
      let maxScore = 7; // 7 fields to check

      if (job.title) score++;
      if (job.description) score++;
      if (job.company_name) score++;
      if (job.location_city || job.location_state) score++;
      if (job.salary_min || job.salary_max) score++;
      if (job.location_city) score++;
      if (job.location_state) score++;

      return score / maxScore;
    });

    avgCompleteness =
      completenessScores.reduce((sum, score) => sum + score, 0) / completenessScores.length;
  }

  // Calculate error rate
  const recentSyncsList = recentSyncs || [];
  const successfulSyncs = recentSyncsList.filter((s) => s.status === 'success').length;
  const failedSyncs = recentSyncsList.filter((s) => s.status === 'failed').length;
  const totalSyncs = recentSyncsList.length;
  const errorRate = totalSyncs > 0 ? failedSyncs / totalSyncs : 0;

  // Aggregate last 30 days stats
  const last30Days = {
    jobs_found: recentSyncsList.reduce((sum, s) => sum + (s.jobs_found || 0), 0),
    jobs_new: recentSyncsList.reduce((sum, s) => sum + (s.jobs_new || 0), 0),
    jobs_duplicates: recentSyncsList.reduce((sum, s) => sum + (s.jobs_duplicates || 0), 0),
    syncs_successful: successfulSyncs,
    syncs_failed: failedSyncs,
  };

  // Calculate overall quality score (weighted average)
  const qualityScore =
    matchRate * 0.3 + // 30% weight on match rate
    importRate * 0.2 + // 20% weight on import rate
    avgCompleteness * 0.3 + // 30% weight on data completeness
    (1 - errorRate) * 0.2; // 20% weight on reliability (inverse of error rate)

  return {
    source_id: sourceId,
    source_name: source.name,
    quality_score: Math.round(qualityScore * 100) / 100, // Round to 2 decimals
    jobs_total: totalJobsCount,
    jobs_matched: matchedJobsCount,
    match_rate: Math.round(matchRate * 100) / 100,
    jobs_imported: importedJobsCount,
    import_rate: Math.round(importRate * 100) / 100,
    avg_completeness: Math.round(avgCompleteness * 100) / 100,
    error_rate: Math.round(errorRate * 100) / 100,
    last_30_days: last30Days,
  };
}

/**
 * Get quality metrics for all sources
 */
export async function getAllSourceQualityMetrics(): Promise<SourceQualityMetrics[]> {
  const supabase = await createClient();

  const { data: sources } = await supabase
    .from('job_sources')
    .select('id, name')
    .eq('is_active', true);

  if (!sources) {
    return [];
  }

  const metrics = await Promise.all(
    sources.map((source) => calculateSourceQuality(source.id))
  );

  return metrics.sort((a, b) => b.quality_score - a.quality_score); // Sort by quality score descending
}

