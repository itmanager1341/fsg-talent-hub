/**
 * Job Normalization Service
 * 
 * Normalizes job data from various sources into a consistent format
 */

export interface NormalizedJob {
  external_id: string;
  source_url: string;
  title: string;
  description?: string;
  company_name?: string;
  company_url?: string;
  location_city?: string;
  location_state?: string;
  location_country?: string;
  salary_min?: number;
  salary_max?: number;
  job_type?: string;
  work_setting?: string;
  experience_level?: string;
  raw_data: Record<string, unknown>;
  expires_at?: string;
}

/**
 * Normalize job title (remove extra whitespace, standardize)
 */
export function normalizeJobTitle(title: string): string {
  return title
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^Senior\s+/i, 'Senior ')
    .replace(/^Junior\s+/i, 'Junior ')
    .replace(/\s*-\s*/g, ' - ');
}

/**
 * Normalize company name
 */
export function normalizeCompanyName(companyName: string | null | undefined): string | undefined {
  if (!companyName) return undefined;
  
  return companyName
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\.(com|net|org|io)$/i, '')
    .replace(/^The\s+/i, '')
    .trim();
}

/**
 * Parse salary from text
 */
export function parseSalary(salaryText: string | null | undefined): {
  min?: number;
  max?: number;
} {
  if (!salaryText) return {};

  const cleaned = salaryText.replace(/[$,]/g, '').toLowerCase();
  
  // Range format: "50000 - 100000" or "$50k - $100k"
  const rangeMatch = cleaned.match(/(\d+)\s*(?:k|thousand)?\s*[-–—]\s*(\d+)\s*(?:k|thousand)?/);
  if (rangeMatch) {
    let min = parseInt(rangeMatch[1], 10);
    let max = parseInt(rangeMatch[2], 10);
    
    // Convert k to thousands
    if (cleaned.includes('k') && min < 1000) min *= 1000;
    if (cleaned.includes('k') && max < 1000) max *= 1000;
    
    return { min, max };
  }
  
  // Single value: "$50,000" or "$50k"
  const singleMatch = cleaned.match(/(\d+)\s*(?:k|thousand)?/);
  if (singleMatch) {
    let value = parseInt(singleMatch[1], 10);
    if (cleaned.includes('k') && value < 1000) value *= 1000;
    return { min: value };
  }
  
  return {};
}

/**
 * Extract work setting from text
 */
export function extractWorkSetting(
  text: string | null | undefined,
  locationCity?: string | null,
  locationState?: string | null
): 'onsite' | 'remote' | 'hybrid' {
  if (!text) {
    // If no location info, assume remote
    if (!locationCity && !locationState) {
      return 'remote';
    }
    return 'onsite';
  }

  const lower = text.toLowerCase();
  
  if (lower.includes('remote') || lower.includes('work from home') || lower.includes('wfh')) {
    if (lower.includes('hybrid') || lower.includes('partially')) {
      return 'hybrid';
    }
    return 'remote';
  }
  
  if (lower.includes('hybrid') || lower.includes('flexible')) {
    return 'hybrid';
  }
  
  return 'onsite';
}

/**
 * Extract experience level from text
 */
export function extractExperienceLevel(
  text: string | null | undefined
): 'entry' | 'mid' | 'senior' | 'lead' | 'executive' | undefined {
  if (!text) return undefined;

  const lower = text.toLowerCase();
  
  if (lower.includes('executive') || lower.includes('c-level') || lower.includes('c suite')) {
    return 'executive';
  }
  
  if (lower.includes('lead') || lower.includes('principal') || lower.includes('architect')) {
    return 'lead';
  }
  
  if (lower.includes('senior') || lower.includes('sr.')) {
    return 'senior';
  }
  
  if (lower.includes('entry') || lower.includes('junior') || lower.includes('associate') || lower.includes('intern')) {
    return 'entry';
  }
  
  // Check for years of experience
  const yearsMatch = lower.match(/(\d+)\+?\s*years?/);
  if (yearsMatch) {
    const years = parseInt(yearsMatch[1], 10);
    if (years >= 10) return 'executive';
    if (years >= 7) return 'lead';
    if (years >= 5) return 'senior';
    if (years >= 2) return 'mid';
    return 'entry';
  }
  
  return 'mid'; // Default
}

/**
 * Extract job type from text
 */
export function extractJobType(
  text: string | null | undefined
): 'full_time' | 'part_time' | 'contract' | 'internship' | 'temporary' {
  if (!text) return 'full_time';

  const lower = text.toLowerCase();
  
  if (lower.includes('part-time') || lower.includes('part time')) {
    return 'part_time';
  }
  
  if (lower.includes('contract') || lower.includes('contractor') || lower.includes('1099')) {
    return 'contract';
  }
  
  if (lower.includes('intern') || lower.includes('internship')) {
    return 'internship';
  }
  
  if (lower.includes('temp') || lower.includes('temporary')) {
    return 'temporary';
  }
  
  return 'full_time';
}

/**
 * Clean and normalize job description
 */
export function normalizeDescription(description: string | null | undefined): string | undefined {
  if (!description) return undefined;
  
  return description
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .substring(0, 10000); // Limit length
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return undefined;
  }
}

