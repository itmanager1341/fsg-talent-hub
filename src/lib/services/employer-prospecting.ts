import { createClient } from '@/lib/supabase/server';

export interface EmployerProspect {
  id: string;
  company_name: string;
  company_url: string | null;
  job_count: number;
  first_seen_at: string;
  last_seen_at: string;
  hubspot_company_id: string | null;
  hubspot_contact_id: string | null;
  enrichment_status: 'pending' | 'enriched' | 'failed';
  enrichment_data: Record<string, unknown> | null;
  outreach_status: 'pending' | 'contacted' | 'responded' | 'converted' | 'rejected';
  outreach_date: string | null;
  conversion_date: string | null;
  notes: string | null;
  created_company_id: string | null; // Links to auto-created company
}

// Minimal job info needed for employer identification
interface JobCompanyInfo {
  company_name: string | null;
  company_url: string | null;
  matched_company_id: string | null;
}

/**
 * Identify potential new employers from external jobs
 * Returns companies that don't exist in our database
 */
export async function identifyNewEmployers(
  externalJobs: JobCompanyInfo[]
): Promise<Array<{ company_name: string; company_url: string | null; job_count: number }>> {
  const supabase = await createClient();

  // Get all unique company names from external jobs
  const companyMap = new Map<string, { url: string | null; count: number }>();

  for (const job of externalJobs) {
    if (job.company_name && !job.matched_company_id) {
      const existing = companyMap.get(job.company_name) || { url: job.company_url, count: 0 };
      companyMap.set(job.company_name, {
        url: existing.url || job.company_url,
        count: existing.count + 1,
      });
    }
  }

  // Check which companies don't exist in our database
  const newEmployers: Array<{ company_name: string; company_url: string | null; job_count: number }> = [];

  for (const [companyName, data] of companyMap.entries()) {
    const { data: existing } = await supabase
      .from('companies')
      .select('id')
      .ilike('name', companyName)
      .limit(1)
      .single();

    if (!existing) {
      newEmployers.push({
        company_name: companyName,
        company_url: data.url,
        job_count: data.count,
      });
    }
  }

  return newEmployers;
}

/**
 * Store employer prospect in database
 */
export async function storeEmployerProspect(
  prospect: Omit<EmployerProspect, 'id'>
): Promise<string> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('employer_prospects')
    .insert({
      company_name: prospect.company_name,
      company_url: prospect.company_url,
      job_count: prospect.job_count,
      first_seen_at: prospect.first_seen_at,
      last_seen_at: prospect.last_seen_at,
      hubspot_company_id: prospect.hubspot_company_id,
      hubspot_contact_id: prospect.hubspot_contact_id,
      enrichment_status: prospect.enrichment_status,
      enrichment_data: prospect.enrichment_data,
      outreach_status: prospect.outreach_status,
      outreach_date: prospect.outreach_date,
      conversion_date: prospect.conversion_date,
      notes: prospect.notes,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to store prospect: ${error.message}`);
  }

  return data.id;
}

/**
 * Enrich company data from external sources
 */
export async function enrichCompanyData(
  companyName: string,
  companyUrl: string | null
): Promise<{
  website?: string;
  industry?: string;
  description?: string;
  employee_count?: string;
  headquarters?: string;
  linkedin_url?: string;
}> {
  // Extract domain from URL
  let domain: string | undefined;
  if (companyUrl) {
    try {
      const url = new URL(companyUrl);
      domain = url.hostname.replace('www.', '');
    } catch {
      // Invalid URL, skip domain extraction
    }
  }

  // Basic enrichment - in production, would use APIs like Clearbit, FullContact, etc.
  const enriched: {
    website?: string;
    industry?: string;
    description?: string;
    employee_count?: string;
    headquarters?: string;
    linkedin_url?: string;
  } = {
    website: companyUrl || undefined,
  };

  // Try to infer industry from company name/URL
  const nameLower = companyName.toLowerCase();
  if (nameLower.includes('mortgage') || nameLower.includes('lending')) {
    enriched.industry = 'Financial Services - Mortgage';
  } else if (nameLower.includes('m&a') || nameLower.includes('merger') || nameLower.includes('acquisition')) {
    enriched.industry = 'Financial Services - M&A';
  } else if (nameLower.includes('bank') || nameLower.includes('credit union')) {
    enriched.industry = 'Financial Services - Banking';
  }

  return enriched;
}

/**
 * Create HubSpot company and contact for employer prospect
 */
export async function createHubSpotLead(
  companyName: string,
  companyUrl: string | null,
  jobCount: number,
  enrichmentData?: Record<string, unknown>
): Promise<{ company_id: string; contact_id: string | null }> {
  const supabase = await createClient();

  try {
    // Call HubSpot sync edge function to create company
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Not authenticated');
    }

    const hubspotUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-hubspot-lead`;
    
    const response = await fetch(hubspotUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        company_name: companyName,
        company_url: companyUrl,
        job_count: jobCount,
        enrichment_data: enrichmentData,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create HubSpot lead');
    }

    const result = await response.json();
    return {
      company_id: result.company_id,
      contact_id: result.contact_id || null,
    };
  } catch (error) {
    console.error('Error creating HubSpot lead:', error);
    throw error;
  }
}

/**
 * Process employer prospects from external jobs
 */
export async function processEmployerProspects(
  externalJobIds: string[]
): Promise<{ prospects_created: number; hubspot_leads_created: number }> {
  const supabase = await createClient();

  // Get external jobs
  const { data: externalJobs } = await supabase
    .from('external_jobs')
    .select('*')
    .in('id', externalJobIds);

  if (!externalJobs || externalJobs.length === 0) {
    return { prospects_created: 0, hubspot_leads_created: 0 };
  }

  // Identify new employers
  const newEmployers = await identifyNewEmployers(
    externalJobs.map((job) => ({
      company_name: job.company_name,
      company_url: job.company_url,
      matched_company_id: job.matched_company_id,
    }))
  );

  let prospectsCreated = 0;
  let hubspotLeadsCreated = 0;

  for (const employer of newEmployers) {
    try {
      // Check if prospect already exists
      const { data: existing } = await supabase
        .from('employer_prospects')
        .select('id')
        .ilike('company_name', employer.company_name)
        .limit(1)
        .single();

      if (existing) {
        // Update existing prospect
        await supabase
          .from('employer_prospects')
          .update({
            job_count: employer.job_count,
            last_seen_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
        continue;
      }

      // Enrich company data
      const enrichmentData = await enrichCompanyData(employer.company_name, employer.company_url);

      // Create HubSpot lead
      let hubspotCompanyId: string | null = null;
      let hubspotContactId: string | null = null;

      try {
        const hubspotResult = await createHubSpotLead(
          employer.company_name,
          employer.company_url,
          employer.job_count,
          enrichmentData
        );
        hubspotCompanyId = hubspotResult.company_id;
        hubspotContactId = hubspotResult.contact_id;
        hubspotLeadsCreated++;
      } catch (error) {
        console.error(`Failed to create HubSpot lead for ${employer.company_name}:`, error);
        // Continue even if HubSpot creation fails
      }

      // Store prospect
      await storeEmployerProspect({
        company_name: employer.company_name,
        company_url: employer.company_url,
        job_count: employer.job_count,
        first_seen_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
        hubspot_company_id: hubspotCompanyId,
        hubspot_contact_id: hubspotContactId,
        enrichment_status: Object.keys(enrichmentData).length > 0 ? 'enriched' : 'pending',
        enrichment_data: enrichmentData,
        outreach_status: 'pending',
        outreach_date: null,
        conversion_date: null,
        notes: null,
        created_company_id: null, // Legacy flow - company created separately via job import
      });

      prospectsCreated++;
    } catch (error) {
      console.error(`Error processing prospect ${employer.company_name}:`, error);
    }
  }

  return { prospects_created: prospectsCreated, hubspot_leads_created: hubspotLeadsCreated };
}

/**
 * Update outreach status for a prospect
 */
export async function updateOutreachStatus(
  prospectId: string,
  status: EmployerProspect['outreach_status'],
  notes?: string
): Promise<void> {
  const supabase = await createClient();

  const update: Partial<EmployerProspect> = {
    outreach_status: status,
    outreach_date: status !== 'pending' ? new Date().toISOString() : null,
  };

  if (status === 'converted') {
    update.conversion_date = new Date().toISOString();
  }

  if (notes) {
    update.notes = notes;
  }

  await supabase
    .from('employer_prospects')
    .update(update)
    .eq('id', prospectId);
}

/**
 * Get all employer prospects
 */
export async function getEmployerProspects(filters?: {
  outreach_status?: EmployerProspect['outreach_status'];
  enrichment_status?: EmployerProspect['enrichment_status'];
}): Promise<EmployerProspect[]> {
  const supabase = await createClient();

  let query = supabase
    .from('employer_prospects')
    .select('*')
    .order('first_seen_at', { ascending: false });

  if (filters?.outreach_status) {
    query = query.eq('outreach_status', filters.outreach_status);
  }

  if (filters?.enrichment_status) {
    query = query.eq('enrichment_status', filters.enrichment_status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get prospects: ${error.message}`);
  }

  return (data || []) as EmployerProspect[];
}

// =============================================================================
// BACKGROUND HUBSPOT SYNC FUNCTIONS
// These functions are called by background jobs, not inline during import
// =============================================================================

export interface HubSpotSyncResult {
  synced: number;
  failed: number;
  errors: string[];
}

/**
 * Get companies pending HubSpot sync
 */
export async function getCompaniesPendingHubSpotSync(
  limit = 50
): Promise<Array<{ id: string; name: string; website: string | null }>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('companies')
    .select('id, name, website')
    .eq('hubspot_sync_status', 'pending')
    .eq('is_verified', false) // Only sync unverified (prospected) companies
    .limit(limit);

  if (error) {
    throw new Error(`Failed to get pending companies: ${error.message}`);
  }

  return data || [];
}

/**
 * Sync a single company to HubSpot
 */
export async function syncCompanyToHubSpot(
  companyId: string
): Promise<{ success: boolean; hubspotId?: string; error?: string }> {
  const supabase = await createClient();

  // Get company details
  const { data: company, error: fetchError } = await supabase
    .from('companies')
    .select('id, name, website, industry, headquarters_city, headquarters_state')
    .eq('id', companyId)
    .single();

  if (fetchError || !company) {
    return { success: false, error: 'Company not found' };
  }

  try {
    // Get session for edge function call
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      return { success: false, error: 'No auth session' };
    }

    // Call create-hubspot-lead edge function
    const hubspotUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-hubspot-lead`;

    const response = await fetch(hubspotUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        company_name: company.name,
        company_url: company.website,
        industry: company.industry,
        city: company.headquarters_city,
        state: company.headquarters_state,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || `HubSpot API error: ${response.status}`);
    }

    const result = await response.json();
    const hubspotId = result.company_id;

    // Update company with HubSpot ID
    await supabase
      .from('companies')
      .update({
        hubspot_id: hubspotId,
        hubspot_sync_status: 'synced',
        hubspot_sync_error: null,
      })
      .eq('id', companyId);

    // Also update employer_prospects if exists
    await supabase
      .from('employer_prospects')
      .update({
        hubspot_company_id: hubspotId,
      })
      .eq('created_company_id', companyId);

    return { success: true, hubspotId };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Update company with error status
    await supabase
      .from('companies')
      .update({
        hubspot_sync_status: 'error',
        hubspot_sync_error: errorMessage,
      })
      .eq('id', companyId);

    return { success: false, error: errorMessage };
  }
}

/**
 * Batch sync all pending companies to HubSpot
 * Called by admin action or scheduled job
 */
export async function batchSyncToHubSpot(limit = 50): Promise<HubSpotSyncResult> {
  const pendingCompanies = await getCompaniesPendingHubSpotSync(limit);

  const result: HubSpotSyncResult = {
    synced: 0,
    failed: 0,
    errors: [],
  };

  for (const company of pendingCompanies) {
    const syncResult = await syncCompanyToHubSpot(company.id);

    if (syncResult.success) {
      result.synced++;
    } else {
      result.failed++;
      result.errors.push(`${company.name}: ${syncResult.error}`);
    }

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  return result;
}

/**
 * Get HubSpot sync status summary
 */
export async function getHubSpotSyncStatus(): Promise<{
  pending: number;
  synced: number;
  error: number;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('companies')
    .select('hubspot_sync_status')
    .eq('is_verified', false); // Only count prospected companies

  if (error) {
    throw new Error(`Failed to get sync status: ${error.message}`);
  }

  const counts = {
    pending: 0,
    synced: 0,
    error: 0,
  };

  for (const company of data || []) {
    const status = company.hubspot_sync_status as string;
    if (status === 'pending') counts.pending++;
    else if (status === 'synced') counts.synced++;
    else if (status === 'error') counts.error++;
  }

  return counts;
}
