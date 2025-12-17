import { createClient } from '@/lib/supabase/server';

export interface CompanyMatch {
  company_id: string;
  confidence: number;
  method: 'exact_name' | 'fuzzy_name' | 'domain' | 'manual';
}

/**
 * Match external job company to existing company in database
 * Returns the best match with confidence score
 */
export async function matchCompany(
  companyName: string | null,
  companyUrl: string | null
): Promise<CompanyMatch | null> {
  if (!companyName) {
    return null;
  }

  const supabase = await createClient();

  // 1. Try exact name match
  const { data: exactMatch } = await supabase
    .from('companies')
    .select('id, name')
    .ilike('name', companyName.trim())
    .eq('is_active', true)
    .limit(1)
    .single();

  if (exactMatch) {
    return {
      company_id: exactMatch.id,
      confidence: 1.0,
      method: 'exact_name',
    };
  }

  // 2. Try fuzzy name match using pg_trgm similarity
  // First try with ilike to get candidates
  const { data: fuzzyCandidates } = await supabase
    .from('companies')
    .select('id, name')
    .ilike('name', `%${companyName.trim()}%`)
    .eq('is_active', true)
    .limit(10);

  if (fuzzyCandidates && fuzzyCandidates.length > 0) {
    // Calculate similarity for each candidate
    let bestMatch: { id: string; name: string; similarity: number } | null = null;
    
    for (const candidate of fuzzyCandidates) {
      const similarity = calculateSimpleSimilarity(
        companyName.trim().toLowerCase(),
        candidate.name.toLowerCase()
      );
      
      if (!bestMatch || similarity > bestMatch.similarity) {
        bestMatch = {
          id: candidate.id,
          name: candidate.name,
          similarity,
        };
      }
    }

    if (bestMatch && bestMatch.similarity > 0.8) {
      return {
        company_id: bestMatch.id,
        confidence: bestMatch.similarity,
        method: 'fuzzy_name',
      };
    }
  }

  // 3. Try domain match if company_url is available
  if (companyUrl) {
    try {
      const domain = extractDomain(companyUrl);
      if (domain) {
        const { data: domainMatch } = await supabase
          .from('companies')
          .select('id, website')
          .ilike('website', `%${domain}%`)
          .eq('is_active', true)
          .limit(1)
          .single();

        if (domainMatch) {
          return {
            company_id: domainMatch.id,
            confidence: 0.85,
            method: 'domain',
          };
        }
      }
    } catch (error) {
      // Ignore domain extraction errors
      console.warn('Error extracting domain:', error);
    }
  }

  return null;
}

/**
 * Update external job with company match
 */
export async function updateExternalJobMatch(
  externalJobId: string,
  match: CompanyMatch | null
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('external_jobs')
    .update({
      matched_company_id: match?.company_id ?? null,
      match_confidence: match?.confidence ?? null,
      match_method: match?.method ?? null,
      status: match ? 'matched' : 'pending',
    })
    .eq('id', externalJobId);

  if (error) {
    console.error('Error updating external job match:', error);
    throw new Error('Failed to update external job match');
  }
}

/**
 * Calculate simple string similarity (0-1)
 */
function calculateSimpleSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) {
    return 1.0;
  }

  // Check if one string contains the other
  if (longer.includes(shorter)) {
    return shorter.length / longer.length;
  }

  // Simple character overlap
  const set1 = new Set(longer.toLowerCase());
  const set2 = new Set(shorter.toLowerCase());
  let intersection = 0;

  for (const char of set2) {
    if (set1.has(char)) {
      intersection++;
    }
  }

  const union = set1.size + set2.size - intersection;
  return union > 0 ? intersection / union : 0;
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string | null {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return null;
  }
}

