'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Types
export interface CandidateSearchFilters {
  query?: string;
  state?: string;
  city?: string;
  willingToRelocate?: boolean;
  jobTypes?: string[];
  workSettings?: string[];
  industries?: string[];
  matchJobId?: string; // For AI matching
}

export interface CandidateSearchResult {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  headline: string | null;
  summary: string | null;
  city: string | null;
  state: string | null;
  willing_to_relocate: boolean;
  desired_job_types: string[];
  desired_work_settings: string[];
  desired_industries: string[];
  resume_url: string | null;
  is_searchable: boolean;
  is_saved?: boolean;
  match_score?: number;
}

export interface SavedCandidate {
  id: string;
  candidate_id: string;
  notes: string | null;
  created_at: string;
  candidate: CandidateSearchResult;
}

export interface CandidateInvitation {
  id: string;
  job_id: string;
  candidate_id: string;
  message: string | null;
  status: 'pending' | 'viewed' | 'applied' | 'declined';
  created_at: string;
  viewed_at: string | null;
  job?: {
    id: string;
    title: string;
    company: { name: string } | null;
  };
  candidate?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
}

// Helper to get employer context
async function getEmployerContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated', user: null, companyUser: null, company: null };
  }

  const { data: companyUser } = await supabase
    .from('company_users')
    .select('*, company:companies(*)')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (!companyUser) {
    return { error: 'No company association', user, companyUser: null, company: null };
  }

  const company = Array.isArray(companyUser.company)
    ? companyUser.company[0]
    : companyUser.company;

  return { error: null, user, companyUser, company };
}

// Check if company has access to resume database (starter+ tier)
export async function checkResumeDatabaseAccess(): Promise<{
  hasAccess: boolean;
  tier: string;
  error?: string;
}> {
  const { error, company } = await getEmployerContext();

  if (error || !company) {
    return { hasAccess: false, tier: 'free', error: error || 'No company found' };
  }

  const tier = company.tier || 'free';
  const hasAccess = tier !== 'free';

  return { hasAccess, tier };
}

// Search candidates with filters
export async function searchCandidates(
  filters: CandidateSearchFilters,
  page: number = 1,
  pageSize: number = 20
): Promise<{
  candidates: CandidateSearchResult[];
  total: number;
  error?: string;
}> {
  const { error: authError, user, company } = await getEmployerContext();

  if (authError || !user || !company) {
    return { candidates: [], total: 0, error: authError || 'Not authorized' };
  }

  // Check tier access
  const tier = company.tier || 'free';
  if (tier === 'free') {
    return { candidates: [], total: 0, error: 'Upgrade to access resume database' };
  }

  const supabase = await createClient();

  // Build base query
  let query = supabase
    .from('candidates')
    .select(
      `
      id, first_name, last_name, email, phone, headline, summary,
      city, state, willing_to_relocate, desired_job_types,
      desired_work_settings, desired_industries, resume_url, is_searchable
    `,
      { count: 'exact' }
    )
    .eq('is_active', true)
    .eq('is_searchable', true);

  // Apply text search
  if (filters.query) {
    const q = filters.query.trim();
    query = query.or(
      `first_name.ilike.%${q}%,last_name.ilike.%${q}%,headline.ilike.%${q}%,summary.ilike.%${q}%`
    );
  }

  // Apply location filters
  if (filters.state) {
    query = query.eq('state', filters.state.toUpperCase());
  }

  if (filters.city) {
    query = query.ilike('city', `%${filters.city}%`);
  }

  if (filters.willingToRelocate) {
    query = query.eq('willing_to_relocate', true);
  }

  // Apply job type filter
  if (filters.jobTypes && filters.jobTypes.length > 0) {
    query = query.overlaps('desired_job_types', filters.jobTypes);
  }

  // Apply work setting filter
  if (filters.workSettings && filters.workSettings.length > 0) {
    query = query.overlaps('desired_work_settings', filters.workSettings);
  }

  // Apply industry filter
  if (filters.industries && filters.industries.length > 0) {
    query = query.overlaps('desired_industries', filters.industries);
  }

  // Pagination
  const offset = (page - 1) * pageSize;
  query = query.range(offset, offset + pageSize - 1).order('updated_at', { ascending: false });

  const { data: candidates, count, error } = await query;

  if (error) {
    console.error('Error searching candidates:', error);
    return { candidates: [], total: 0, error: error.message };
  }

  // Get saved status for these candidates
  const candidateIds = (candidates || []).map((c) => c.id);
  const { data: savedCandidates } = await supabase
    .from('saved_candidates')
    .select('candidate_id')
    .eq('company_id', company.id)
    .in('candidate_id', candidateIds);

  const savedSet = new Set((savedCandidates || []).map((s) => s.candidate_id));

  const results: CandidateSearchResult[] = (candidates || []).map((c) => ({
    ...c,
    is_saved: savedSet.has(c.id),
  }));

  return { candidates: results, total: count || 0 };
}

// Get matching candidates for a job using vector search
export async function getMatchingCandidates(
  jobId: string,
  limit: number = 20
): Promise<{
  candidates: CandidateSearchResult[];
  error?: string;
}> {
  const { error: authError, user, company } = await getEmployerContext();

  if (authError || !user || !company) {
    return { candidates: [], error: authError || 'Not authorized' };
  }

  // Check tier access
  const tier = company.tier || 'free';
  if (tier === 'free') {
    return { candidates: [], error: 'Upgrade to access AI matching' };
  }

  const supabase = await createClient();

  // Check if job belongs to this company
  const { data: job } = await supabase
    .from('jobs')
    .select('id, company_id, embedding')
    .eq('id', jobId)
    .single();

  if (!job || job.company_id !== company.id) {
    return { candidates: [], error: 'Job not found or access denied' };
  }

  if (!job.embedding) {
    return { candidates: [], error: 'Job embedding not available' };
  }

  // Call database function for vector search
  const { data, error } = await supabase.rpc('get_matching_candidates', {
    target_job_id: jobId,
    match_count: limit,
  });

  if (error) {
    console.error('Error getting matching candidates:', error);
    return { candidates: [], error: error.message };
  }

  if (!data || data.length === 0) {
    return { candidates: [] };
  }

  // Get full candidate details
  const candidateIds = data.map((c: { id: string }) => c.id);
  const { data: candidates } = await supabase
    .from('candidates')
    .select(
      `
      id, first_name, last_name, email, phone, headline, summary,
      city, state, willing_to_relocate, desired_job_types,
      desired_work_settings, desired_industries, resume_url, is_searchable
    `
    )
    .in('id', candidateIds);

  // Get saved status
  const { data: savedCandidates } = await supabase
    .from('saved_candidates')
    .select('candidate_id')
    .eq('company_id', company.id)
    .in('candidate_id', candidateIds);

  const savedSet = new Set((savedCandidates || []).map((s) => s.candidate_id));

  // Merge with similarity scores
  const scoreMap = new Map<string, number>(
    data.map((c: { id: string; similarity: number }) => [c.id, c.similarity])
  );

  const results: CandidateSearchResult[] = (candidates || []).map((c) => ({
    ...c,
    is_saved: savedSet.has(c.id),
    match_score: Math.round((scoreMap.get(c.id) ?? 0) * 100),
  }));

  // Sort by match score
  results.sort((a, b) => (b.match_score || 0) - (a.match_score || 0));

  return { candidates: results };
}

// Save a candidate
export async function saveCandidate(
  candidateId: string
): Promise<{ success: boolean; error?: string }> {
  const { error: authError, user, company } = await getEmployerContext();

  if (authError || !user || !company) {
    return { success: false, error: authError || 'Not authorized' };
  }

  const supabase = await createClient();

  const { error } = await supabase.from('saved_candidates').insert({
    company_id: company.id,
    candidate_id: candidateId,
    saved_by: user.id,
  });

  if (error) {
    if (error.code === '23505') {
      // Unique violation - already saved
      return { success: true };
    }
    console.error('Error saving candidate:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/employers/candidates');
  revalidatePath('/employers/candidates/saved');
  return { success: true };
}

// Unsave a candidate
export async function unsaveCandidate(
  candidateId: string
): Promise<{ success: boolean; error?: string }> {
  const { error: authError, company } = await getEmployerContext();

  if (authError || !company) {
    return { success: false, error: authError || 'Not authorized' };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('saved_candidates')
    .delete()
    .eq('company_id', company.id)
    .eq('candidate_id', candidateId);

  if (error) {
    console.error('Error unsaving candidate:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/employers/candidates');
  revalidatePath('/employers/candidates/saved');
  return { success: true };
}

// Update notes on a saved candidate
export async function updateSavedCandidateNotes(
  candidateId: string,
  notes: string
): Promise<{ success: boolean; error?: string }> {
  const { error: authError, company } = await getEmployerContext();

  if (authError || !company) {
    return { success: false, error: authError || 'Not authorized' };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('saved_candidates')
    .update({ notes })
    .eq('company_id', company.id)
    .eq('candidate_id', candidateId);

  if (error) {
    console.error('Error updating notes:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/employers/candidates/saved');
  return { success: true };
}

// Get saved candidates for the company
export async function getSavedCandidates(): Promise<{
  candidates: SavedCandidate[];
  error?: string;
}> {
  const { error: authError, company } = await getEmployerContext();

  if (authError || !company) {
    return { candidates: [], error: authError || 'Not authorized' };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('saved_candidates')
    .select(
      `
      id, candidate_id, notes, created_at,
      candidate:candidates(
        id, first_name, last_name, email, phone, headline, summary,
        city, state, willing_to_relocate, desired_job_types,
        desired_work_settings, desired_industries, resume_url, is_searchable
      )
    `
    )
    .eq('company_id', company.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error getting saved candidates:', error);
    return { candidates: [], error: error.message };
  }

  const candidates: SavedCandidate[] = (data || []).map((s) => ({
    id: s.id,
    candidate_id: s.candidate_id,
    notes: s.notes,
    created_at: s.created_at,
    candidate: {
      ...(Array.isArray(s.candidate) ? s.candidate[0] : s.candidate),
      is_saved: true,
    } as CandidateSearchResult,
  }));

  return { candidates };
}

// Invite a candidate to apply for a job
export async function inviteToApply(
  candidateId: string,
  jobId: string,
  message?: string
): Promise<{ success: boolean; error?: string }> {
  const { error: authError, user, company } = await getEmployerContext();

  if (authError || !user || !company) {
    return { success: false, error: authError || 'Not authorized' };
  }

  const supabase = await createClient();

  // Verify job belongs to company
  const { data: job } = await supabase
    .from('jobs')
    .select('id, company_id')
    .eq('id', jobId)
    .single();

  if (!job || job.company_id !== company.id) {
    return { success: false, error: 'Job not found or access denied' };
  }

  const { error } = await supabase.from('candidate_invitations').insert({
    job_id: jobId,
    candidate_id: candidateId,
    invited_by: user.id,
    message: message || null,
  });

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Candidate already invited to this job' };
    }
    console.error('Error inviting candidate:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/employers/candidates');
  return { success: true };
}

// Get invitations sent by the company
export async function getCompanyInvitations(
  jobId?: string
): Promise<{ invitations: CandidateInvitation[]; error?: string }> {
  const { error: authError, company } = await getEmployerContext();

  if (authError || !company) {
    return { invitations: [], error: authError || 'Not authorized' };
  }

  const supabase = await createClient();

  let query = supabase
    .from('candidate_invitations')
    .select(
      `
      id, job_id, candidate_id, message, status, created_at, viewed_at,
      job:jobs(id, title, company:companies(name)),
      candidate:candidates(id, first_name, last_name, email)
    `
    )
    .order('created_at', { ascending: false });

  if (jobId) {
    query = query.eq('job_id', jobId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error getting invitations:', error);
    return { invitations: [], error: error.message };
  }

  // Filter to only company's jobs and format data
  const invitations: CandidateInvitation[] = (data || [])
    .filter((inv) => {
      const job = Array.isArray(inv.job) ? inv.job[0] : inv.job;
      return job && true; // RLS already filters, but just in case
    })
    .map((inv) => {
      const job = Array.isArray(inv.job) ? inv.job[0] : inv.job;
      const company = job?.company
        ? Array.isArray(job.company)
          ? job.company[0]
          : job.company
        : null;
      const candidate = Array.isArray(inv.candidate)
        ? inv.candidate[0]
        : inv.candidate;
      return {
        id: inv.id,
        job_id: inv.job_id,
        candidate_id: inv.candidate_id,
        message: inv.message,
        status: inv.status as CandidateInvitation['status'],
        created_at: inv.created_at,
        viewed_at: inv.viewed_at,
        job: job
          ? {
              id: job.id,
              title: job.title,
              company,
            }
          : undefined,
        candidate,
      };
    });

  return { invitations };
}

// Get invitations for a candidate (to show in their dashboard)
export async function getCandidateInvitations(): Promise<{
  invitations: CandidateInvitation[];
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { invitations: [], error: 'Not authenticated' };
  }

  // Get candidate record
  const { data: candidate } = await supabase
    .from('candidates')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!candidate) {
    return { invitations: [], error: 'No candidate profile' };
  }

  const { data, error } = await supabase
    .from('candidate_invitations')
    .select(
      `
      id, job_id, candidate_id, message, status, created_at, viewed_at,
      job:jobs(id, title, company:companies(name))
    `
    )
    .eq('candidate_id', candidate.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error getting candidate invitations:', error);
    return { invitations: [], error: error.message };
  }

  const invitations: CandidateInvitation[] = (data || []).map((inv) => {
    const job = Array.isArray(inv.job) ? inv.job[0] : inv.job;
    const company = job?.company
      ? Array.isArray(job.company)
        ? job.company[0]
        : job.company
      : null;
    return {
      id: inv.id,
      job_id: inv.job_id,
      candidate_id: inv.candidate_id,
      message: inv.message,
      status: inv.status as CandidateInvitation['status'],
      created_at: inv.created_at,
      viewed_at: inv.viewed_at,
      job: job
        ? {
            id: job.id,
            title: job.title,
            company,
          }
        : undefined,
    };
  });

  return { invitations };
}

// Update invitation status (for candidates)
export async function updateInvitationStatus(
  invitationId: string,
  status: 'viewed' | 'applied' | 'declined'
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const updateData: { status: string; viewed_at?: string } = { status };
  if (status === 'viewed') {
    updateData.viewed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('candidate_invitations')
    .update(updateData)
    .eq('id', invitationId);

  if (error) {
    console.error('Error updating invitation:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/account/candidate');
  return { success: true };
}

// Get a single candidate by ID (for preview modal)
export async function getCandidateById(
  candidateId: string
): Promise<{ candidate: CandidateSearchResult | null; error?: string }> {
  const { error: authError, company } = await getEmployerContext();

  if (authError || !company) {
    return { candidate: null, error: authError || 'Not authorized' };
  }

  // Check tier access
  const tier = company.tier || 'free';
  if (tier === 'free') {
    return { candidate: null, error: 'Upgrade to access candidate profiles' };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('candidates')
    .select(
      `
      id, first_name, last_name, email, phone, headline, summary,
      city, state, willing_to_relocate, desired_job_types,
      desired_work_settings, desired_industries, resume_url, is_searchable
    `
    )
    .eq('id', candidateId)
    .eq('is_active', true)
    .eq('is_searchable', true)
    .single();

  if (error || !data) {
    return { candidate: null, error: error?.message || 'Candidate not found' };
  }

  // Check if saved
  const { data: saved } = await supabase
    .from('saved_candidates')
    .select('id')
    .eq('company_id', company.id)
    .eq('candidate_id', candidateId)
    .single();

  return {
    candidate: {
      ...data,
      is_saved: !!saved,
    },
  };
}

// Get company's active jobs for invite dropdown
export async function getCompanyActiveJobs(): Promise<{
  jobs: { id: string; title: string }[];
  error?: string;
}> {
  const { error: authError, company } = await getEmployerContext();

  if (authError || !company) {
    return { jobs: [], error: authError || 'Not authorized' };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('jobs')
    .select('id, title')
    .eq('company_id', company.id)
    .eq('status', 'active')
    .order('title');

  if (error) {
    console.error('Error getting jobs:', error);
    return { jobs: [], error: error.message };
  }

  return { jobs: data || [] };
}
