'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/requireAuth';
import { canUseAIRanking, TIER_RANKING_LIMITS } from '@/lib/employer/tier-utils';

interface ActionResult {
  error?: string;
  success?: boolean;
}

export async function updateApplicationStatus(
  applicationId: string,
  status: string
): Promise<ActionResult> {
  const user = await requireAuth();
  const supabase = await createClient();

  // Get application with job info to verify access
  const { data: application } = await supabase
    .from('applications')
    .select(
      `
      id,
      job:jobs!inner(
        id,
        company_id
      )
    `
    )
    .eq('id', applicationId)
    .single();

  if (!application) {
    return { error: 'Application not found' };
  }

  const job = Array.isArray(application.job)
    ? application.job[0]
    : application.job;

  // Verify user has access to this company
  const { data: companyUser } = await supabase
    .from('company_users')
    .select('id, role')
    .eq('company_id', job.company_id)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (!companyUser || !['owner', 'recruiter'].includes(companyUser.role)) {
    return { error: 'You do not have permission to update this application' };
  }

  // Validate status
  const validStatuses = [
    'applied',
    'viewed',
    'screening',
    'interviewing',
    'offered',
    'hired',
    'rejected',
  ];
  if (!validStatuses.includes(status)) {
    return { error: 'Invalid status' };
  }

  // Update application status
  const { error } = await supabase
    .from('applications')
    .update({
      status,
      status_changed_at: new Date().toISOString(),
      status_changed_by: user.id,
      viewed_at:
        status !== 'applied' ? new Date().toISOString() : undefined,
    })
    .eq('id', applicationId);

  if (error) {
    console.error('Error updating application status:', error);
    return { error: 'Failed to update application status' };
  }

  return { success: true };
}

// Types for ranking
export interface RankingResult {
  score: number;
  reasons: {
    category: string;
    assessment: 'strong_match' | 'partial_match' | 'weak_match' | 'no_match';
    details: string;
  }[];
  summary: string;
}

interface RankActionResult {
  error?: string;
  success?: boolean;
  result?: RankingResult;
  upgrade_required?: boolean;
}

// Get company tier for current user
async function getCompanyTier(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase
    .from('company_users')
    .select('company:companies(id, tier)')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();

  if (!data?.company) return null;
  const company = Array.isArray(data.company) ? data.company[0] : data.company;
  return company;
}


// Rank a single applicant
export async function rankApplicant(applicationId: string): Promise<RankActionResult> {
  const user = await requireAuth();
  const supabase = await createClient();

  // Get application with job and candidate info
  const { data: application } = await supabase
    .from('applications')
    .select(`
      id,
      candidate_id,
      job:jobs!inner(
        id,
        company_id
      )
    `)
    .eq('id', applicationId)
    .single();

  if (!application) {
    return { error: 'Application not found' };
  }

  const job = Array.isArray(application.job) ? application.job[0] : application.job;

  // Verify access and get company tier
  const company = await getCompanyTier(supabase, user.id);
  if (!company || company.id !== job.company_id) {
    return { error: 'Access denied' };
  }

  if (!canUseAIRanking(company.tier)) {
    return {
      error: 'AI ranking requires Professional or Enterprise tier',
      upgrade_required: true,
    };
  }

  // Get session token for edge function
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return { error: 'Authentication required' };
  }

  // Call edge function
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const response = await fetch(`${supabaseUrl}/functions/v1/rank-applicant`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      application_id: applicationId,
      job_id: job.id,
      candidate_id: application.candidate_id,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    if (response.status === 429) {
      return { error: errorBody.error || 'Daily ranking limit exceeded' };
    }
    if (response.status === 403 && errorBody.upgrade_required) {
      return { error: errorBody.error, upgrade_required: true };
    }
    return { error: errorBody.error || 'Failed to rank applicant' };
  }

  const result = await response.json();
  return {
    success: true,
    result: {
      score: result.score,
      reasons: result.reasons,
      summary: result.summary,
    },
  };
}

// Bulk rank all unranked applicants for a job
export async function bulkRankApplicants(jobId: string): Promise<{
  error?: string;
  success?: boolean;
  ranked?: number;
  failed?: number;
  upgrade_required?: boolean;
}> {
  const user = await requireAuth();
  const supabase = await createClient();

  // Verify access and get company tier
  const { data: job } = await supabase
    .from('jobs')
    .select('id, company_id')
    .eq('id', jobId)
    .single();

  if (!job) {
    return { error: 'Job not found' };
  }

  const company = await getCompanyTier(supabase, user.id);
  if (!company || company.id !== job.company_id) {
    return { error: 'Access denied' };
  }

  if (!canUseAIRanking(company.tier)) {
    return {
      error: 'AI ranking requires Professional or Enterprise tier',
      upgrade_required: true,
    };
  }

  // Get unranked applications
  const { data: applications } = await supabase
    .from('applications')
    .select('id, candidate_id')
    .eq('job_id', jobId)
    .is('ai_match_score', null);

  if (!applications || applications.length === 0) {
    return { success: true, ranked: 0, failed: 0 };
  }

  // Get session for edge function calls
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return { error: 'Authentication required' };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  let ranked = 0;
  let failed = 0;

  // Process applications (limit to 10 at a time to avoid rate limits)
  const toProcess = applications.slice(0, 10);

  for (const app of toProcess) {
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/rank-applicant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          application_id: app.id,
          job_id: jobId,
          candidate_id: app.candidate_id,
        }),
      });

      if (response.ok) {
        ranked++;
      } else {
        const errorBody = await response.json().catch(() => ({}));
        if (response.status === 429) {
          // Hit rate limit, stop processing
          return {
            success: true,
            ranked,
            failed,
            error: errorBody.error || 'Rate limit reached',
          };
        }
        failed++;
      }
    } catch {
      failed++;
    }
  }

  return { success: true, ranked, failed };
}

// Get ranking usage for current user
export async function getRankingUsage(): Promise<{
  used: number;
  limit: number;
  canRank: boolean;
  tier: string;
}> {
  const user = await requireAuth();
  const supabase = await createClient();

  const company = await getCompanyTier(supabase, user.id);
  const tier = company?.tier || 'free';

  const limit = TIER_RANKING_LIMITS[tier] || 0;

  // Count today's usage
  const today = new Date().toISOString().split('T')[0];
  const { count } = await supabase
    .from('ai_usage_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('feature', 'applicant_ranking')
    .gte('created_at', today);

  const used = count || 0;

  return {
    used,
    limit,
    canRank: canUseAIRanking(tier) && used < limit,
    tier,
  };
}
