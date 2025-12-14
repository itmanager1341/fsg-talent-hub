'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/requireAuth';

interface JobActionResult {
  error?: string;
  jobId?: string;
}

async function verifyCompanyAccess(companyId: string, userId: string) {
  const supabase = await createClient();

  const { data: companyUser } = await supabase
    .from('company_users')
    .select('id, role')
    .eq('company_id', companyId)
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();

  return companyUser;
}

export async function createJob(formData: FormData): Promise<JobActionResult> {
  const user = await requireAuth();
  const supabase = await createClient();

  const companyId = formData.get('company_id') as string;

  // Verify user has access to this company
  const companyUser = await verifyCompanyAccess(companyId, user.id);
  if (!companyUser || !['owner', 'recruiter'].includes(companyUser.role)) {
    return { error: 'You do not have permission to post jobs for this company' };
  }

  // Parse form data
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const requirements = formData.get('requirements') as string | null;
  const benefits = formData.get('benefits') as string | null;
  const department = formData.get('department') as string | null;
  const jobType = formData.get('job_type') as string;
  const experienceLevel = formData.get('experience_level') as string | null;
  const workSetting = formData.get('work_setting') as string;
  const locationCity = formData.get('location_city') as string | null;
  const locationState = formData.get('location_state') as string | null;
  const salaryMin = formData.get('salary_min') as string | null;
  const salaryMax = formData.get('salary_max') as string | null;
  const showSalary = formData.get('show_salary') === 'true';
  const status = formData.get('status') as 'draft' | 'active';

  // Validate required fields
  if (!title || title.trim().length < 3) {
    return { error: 'Job title is required (minimum 3 characters)' };
  }
  if (!description || description.trim().length < 50) {
    return { error: 'Job description is required (minimum 50 characters)' };
  }

  // Create job
  const { data, error } = await supabase
    .from('jobs')
    .insert({
      company_id: companyId,
      posted_by: user.id,
      title: title.trim(),
      description: description.trim(),
      requirements: requirements?.trim() || null,
      benefits: benefits?.trim() || null,
      department: department?.trim() || null,
      job_type: jobType,
      experience_level: experienceLevel || null,
      work_setting: workSetting,
      location_city: locationCity?.trim() || null,
      location_state: locationState || null,
      salary_min: salaryMin ? parseInt(salaryMin, 10) : null,
      salary_max: salaryMax ? parseInt(salaryMax, 10) : null,
      show_salary: showSalary,
      status,
      published_at: status === 'active' ? new Date().toISOString() : null,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating job:', error);
    return { error: 'Failed to create job. Please try again.' };
  }

  return { jobId: data.id };
}

export async function updateJob(
  jobId: string,
  formData: FormData
): Promise<JobActionResult> {
  const user = await requireAuth();
  const supabase = await createClient();

  // Get job and verify ownership
  const { data: job } = await supabase
    .from('jobs')
    .select('id, company_id, status, published_at')
    .eq('id', jobId)
    .single();

  if (!job) {
    return { error: 'Job not found' };
  }

  // Verify user has access to this company
  const companyUser = await verifyCompanyAccess(job.company_id, user.id);
  if (!companyUser || !['owner', 'recruiter'].includes(companyUser.role)) {
    return { error: 'You do not have permission to edit this job' };
  }

  // Parse form data
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const requirements = formData.get('requirements') as string | null;
  const benefits = formData.get('benefits') as string | null;
  const department = formData.get('department') as string | null;
  const jobType = formData.get('job_type') as string;
  const experienceLevel = formData.get('experience_level') as string | null;
  const workSetting = formData.get('work_setting') as string;
  const locationCity = formData.get('location_city') as string | null;
  const locationState = formData.get('location_state') as string | null;
  const salaryMin = formData.get('salary_min') as string | null;
  const salaryMax = formData.get('salary_max') as string | null;
  const showSalary = formData.get('show_salary') === 'true';
  const status = formData.get('status') as 'draft' | 'active';

  // Validate required fields
  if (!title || title.trim().length < 3) {
    return { error: 'Job title is required (minimum 3 characters)' };
  }
  if (!description || description.trim().length < 50) {
    return { error: 'Job description is required (minimum 50 characters)' };
  }

  // Determine published_at
  let publishedAt = job.published_at;
  if (status === 'active' && !job.published_at) {
    publishedAt = new Date().toISOString();
  }

  // Update job
  const { error } = await supabase
    .from('jobs')
    .update({
      title: title.trim(),
      description: description.trim(),
      requirements: requirements?.trim() || null,
      benefits: benefits?.trim() || null,
      department: department?.trim() || null,
      job_type: jobType,
      experience_level: experienceLevel || null,
      work_setting: workSetting,
      location_city: locationCity?.trim() || null,
      location_state: locationState || null,
      salary_min: salaryMin ? parseInt(salaryMin, 10) : null,
      salary_max: salaryMax ? parseInt(salaryMax, 10) : null,
      show_salary: showSalary,
      status,
      published_at: publishedAt,
    })
    .eq('id', jobId);

  if (error) {
    console.error('Error updating job:', error);
    return { error: 'Failed to update job. Please try again.' };
  }

  return { jobId };
}

export async function updateJobStatus(
  jobId: string,
  status: 'draft' | 'active' | 'paused' | 'closed'
): Promise<JobActionResult> {
  const user = await requireAuth();
  const supabase = await createClient();

  // Get job and verify ownership
  const { data: job } = await supabase
    .from('jobs')
    .select('id, company_id, published_at')
    .eq('id', jobId)
    .single();

  if (!job) {
    return { error: 'Job not found' };
  }

  // Verify user has access to this company
  const companyUser = await verifyCompanyAccess(job.company_id, user.id);
  if (!companyUser || !['owner', 'recruiter'].includes(companyUser.role)) {
    return { error: 'You do not have permission to update this job' };
  }

  // Determine published_at
  let publishedAt = job.published_at;
  if (status === 'active' && !job.published_at) {
    publishedAt = new Date().toISOString();
  }

  // Update status
  const { error } = await supabase
    .from('jobs')
    .update({ status, published_at: publishedAt })
    .eq('id', jobId);

  if (error) {
    console.error('Error updating job status:', error);
    return { error: 'Failed to update job status' };
  }

  return { jobId };
}

export async function deleteJob(jobId: string): Promise<JobActionResult> {
  const user = await requireAuth();
  const supabase = await createClient();

  // Get job and verify ownership
  const { data: job } = await supabase
    .from('jobs')
    .select('id, company_id')
    .eq('id', jobId)
    .single();

  if (!job) {
    return { error: 'Job not found' };
  }

  // Verify user has access (only owner can delete)
  const companyUser = await verifyCompanyAccess(job.company_id, user.id);
  if (!companyUser || companyUser.role !== 'owner') {
    return { error: 'Only company owners can delete jobs' };
  }

  // Delete job (cascade will delete applications)
  const { error } = await supabase.from('jobs').delete().eq('id', jobId);

  if (error) {
    console.error('Error deleting job:', error);
    return { error: 'Failed to delete job' };
  }

  return { jobId };
}
