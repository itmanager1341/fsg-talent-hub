/**
 * Source Prioritization Service
 * 
 * Handles deduplication across multiple sources and source priority
 */

import { createClient } from '@/lib/supabase/server';

export interface SourcePriority {
  source_id: string;
  source_name: string;
  priority: number; // Higher = more preferred
  quality_score: number; // 0-1
}

/**
 * Source priority order (higher = preferred)
 * When duplicate jobs found, prefer source with higher priority
 */
const SOURCE_PRIORITY: Record<string, number> = {
  'indeed_api': 100,
  'indeed_rss': 90,
  'adzuna_api': 80,
  'jooble_api': 70,
  'rss': 60,
  'scraper': 50,
  'partner': 40,
};

/**
 * Get source priority
 */
export function getSourcePriority(sourceName: string): number {
  // Check exact match first
  if (SOURCE_PRIORITY[sourceName]) {
    return SOURCE_PRIORITY[sourceName];
  }

  // Check partial matches
  if (sourceName.includes('indeed')) {
    return sourceName.includes('api') ? 100 : 90;
  }
  if (sourceName.includes('adzuna')) {
    return 80;
  }
  if (sourceName.includes('jooble')) {
    return 70;
  }
  if (sourceName.includes('rss')) {
    return 60;
  }

  return 50; // Default
}

/**
 * Check if a job from a new source is a duplicate of an existing job
 * Returns the existing job ID if duplicate, null otherwise
 */
export async function checkCrossSourceDuplicate(
  title: string,
  companyName: string | null,
  locationCity: string | null,
  locationState: string | null,
  excludeSourceId?: string
): Promise<{ external_job_id: string; source_id: string; source_priority: number } | null> {
  const supabase = await createClient();

  // Search for similar jobs in external_jobs
  let query = supabase
    .from('external_jobs')
    .select('id, source_id, title, company_name, location_city, location_state')
    .ilike('title', `%${title.substring(0, 30)}%`);

  if (excludeSourceId) {
    query = query.neq('source_id', excludeSourceId);
  }

  const { data: candidates } = await query.limit(10);

  if (!candidates || candidates.length === 0) {
    return null;
  }

  // Check each candidate for similarity
  for (const candidate of candidates) {
    const titleSimilarity = calculateTitleSimilarity(title, candidate.title);
    const companyMatch = !companyName || !candidate.company_name ||
      candidate.company_name.toLowerCase().trim() === companyName.toLowerCase().trim();
    const locationMatch =
      (!locationCity || candidate.location_city?.toLowerCase() === locationCity.toLowerCase()) &&
      (!locationState || candidate.location_state?.toLowerCase() === locationState.toLowerCase());

    // If high similarity and company/location match, it's a duplicate
    if (titleSimilarity > 0.85 && companyMatch && locationMatch) {
      // Get source priority for comparison
      const { data: source } = await supabase
        .from('job_sources')
        .select('name')
        .eq('id', candidate.source_id)
        .single();

      const sourcePriority = source ? getSourcePriority(source.name) : 50;

      return {
        external_job_id: candidate.id,
        source_id: candidate.source_id,
        source_priority: sourcePriority,
      };
    }
  }

  return null;
}

/**
 * Calculate title similarity (0-1)
 */
function calculateTitleSimilarity(title1: string, title2: string): number {
  const t1 = title1.toLowerCase().trim();
  const t2 = title2.toLowerCase().trim();

  // Exact match
  if (t1 === t2) return 1.0;

  // One contains the other
  if (t1.includes(t2) || t2.includes(t1)) {
    const shorter = t1.length < t2.length ? t1 : t2;
    const longer = t1.length >= t2.length ? t1 : t2;
    return shorter.length / longer.length;
  }

  // Word overlap
  const words1 = new Set(t1.split(/\s+/));
  const words2 = new Set(t2.split(/\s+/));

  let intersection = 0;
  for (const word of words2) {
    if (words1.has(word)) {
      intersection++;
    }
  }

  const union = words1.size + words2.size - intersection;
  return union > 0 ? intersection / union : 0;
}

/**
 * Determine if we should keep the new job or the existing duplicate
 * Returns true if we should keep the new job (higher priority source)
 */
export async function shouldKeepNewJob(
  newSourceId: string,
  existingSourceId: string
): Promise<boolean> {
  const supabase = await createClient();

  const [newSource, existingSource] = await Promise.all([
    supabase.from('job_sources').select('name').eq('id', newSourceId).single(),
    supabase.from('job_sources').select('name').eq('id', existingSourceId).single(),
  ]);

  const newPriority = newSource.data ? getSourcePriority(newSource.data.name) : 50;
  const existingPriority = existingSource.data ? getSourcePriority(existingSource.data.name) : 50;

  return newPriority > existingPriority;
}

