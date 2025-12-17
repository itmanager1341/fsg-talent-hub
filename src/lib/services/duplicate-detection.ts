import { createClient } from '@/lib/supabase/server';

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingJobId?: string;
  confidence: number;
  reason?: string;
}

/**
 * Check if an external job is a duplicate
 * Uses multiple strategies: exact match, title similarity, company + location match
 */
export async function checkDuplicate(
  sourceId: string,
  externalId: string,
  title: string,
  companyName: string | null,
  locationCity: string | null,
  locationState: string | null
): Promise<DuplicateCheckResult> {
  const supabase = await createClient();

  // 1. Check exact external_id match (same source)
  const { data: exactMatch } = await supabase
    .from('external_jobs')
    .select('id')
    .eq('source_id', sourceId)
    .eq('external_id', externalId)
    .limit(1)
    .single();

  if (exactMatch) {
    return {
      isDuplicate: true,
      existingJobId: exactMatch.id,
      confidence: 1.0,
      reason: 'exact_external_id',
    };
  }

  // 2. Check for similar title + company + location (high confidence duplicate)
  if (companyName && (locationCity || locationState)) {
    const { data: similarJobs } = await supabase
      .from('external_jobs')
      .select('id, title, company_name, location_city, location_state')
      .ilike('title', `%${title.substring(0, 20)}%`) // First 20 chars of title
      .ilike('company_name', companyName.trim())
      .eq('source_id', sourceId)
      .limit(5);

    if (similarJobs && similarJobs.length > 0) {
      for (const job of similarJobs) {
        const titleSimilarity = calculateTitleSimilarity(title, job.title);
        const locationMatch =
          (!locationCity || job.location_city?.toLowerCase() === locationCity.toLowerCase()) &&
          (!locationState || job.location_state?.toLowerCase() === locationState.toLowerCase());

        if (titleSimilarity > 0.9 && locationMatch) {
          return {
            isDuplicate: true,
            existingJobId: job.id,
            confidence: titleSimilarity * 0.95, // Slightly lower than exact match
            reason: 'title_company_location_match',
          };
        }
      }
    }
  }

  // 3. Check for title + company match (medium confidence)
  if (companyName) {
    const { data: titleCompanyMatch } = await supabase
      .from('external_jobs')
      .select('id, title')
      .ilike('title', `%${title.substring(0, 30)}%`)
      .ilike('company_name', companyName.trim())
      .eq('source_id', sourceId)
      .limit(1)
      .single();

    if (titleCompanyMatch) {
      const titleSimilarity = calculateTitleSimilarity(title, titleCompanyMatch.title);
      if (titleSimilarity > 0.85) {
        return {
          isDuplicate: true,
          existingJobId: titleCompanyMatch.id,
          confidence: titleSimilarity * 0.8,
          reason: 'title_company_match',
        };
      }
    }
  }

  // 4. Check if already imported as a job (cross-reference with jobs table)
  const { data: importedJob } = await supabase
    .from('jobs')
    .select('id, title, company_id')
    .eq('is_external', true)
    .ilike('title', `%${title.substring(0, 30)}%`)
    .limit(5);

  if (importedJob && importedJob.length > 0) {
    // If we have company name, try to match via company
    if (companyName) {
      for (const job of importedJob) {
        const { data: company } = await supabase
          .from('companies')
          .select('id, name')
          .eq('id', job.company_id)
          .ilike('name', companyName.trim())
          .single();

        if (company) {
          const titleSimilarity = calculateTitleSimilarity(title, job.title);
          if (titleSimilarity > 0.85) {
            return {
              isDuplicate: true,
              existingJobId: job.id,
              confidence: titleSimilarity * 0.75,
              reason: 'already_imported',
            };
          }
        }
      }
    }
  }

  return {
    isDuplicate: false,
    confidence: 0,
  };
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
 * Mark job as duplicate
 */
export async function markAsDuplicate(
  externalJobId: string,
  duplicateOfId: string
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('external_jobs')
    .update({
      status: 'duplicate',
      processing_notes: `Duplicate of ${duplicateOfId}`,
    })
    .eq('id', externalJobId);

  if (error) {
    console.error('Error marking job as duplicate:', error);
    throw new Error('Failed to mark job as duplicate');
  }
}

