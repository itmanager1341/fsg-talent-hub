'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/requireAuth';

interface ActionResult {
  error?: string;
  applicationId?: string;
}

export async function submitApplication(
  formData: FormData
): Promise<ActionResult> {
  const user = await requireAuth();
  const supabase = await createClient();

  const jobId = formData.get('jobId') as string;
  const candidateId = formData.get('candidateId') as string;
  const coverLetter = formData.get('cover_letter') as string | null;
  const resumeUrl = formData.get('resumeUrl') as string | null;

  if (!jobId || !candidateId) {
    return { error: 'Missing required fields' };
  }

  // Verify candidate ownership
  const { data: candidate } = await supabase
    .from('candidates')
    .select('id, user_id')
    .eq('id', candidateId)
    .single();

  if (!candidate || candidate.user_id !== user.id) {
    return { error: 'Unauthorized' };
  }

  // Verify job is active
  const { data: job } = await supabase
    .from('jobs')
    .select('id, status')
    .eq('id', jobId)
    .eq('status', 'active')
    .single();

  if (!job) {
    return { error: 'This job is no longer accepting applications' };
  }

  // Check for existing application
  const { data: existing } = await supabase
    .from('applications')
    .select('id')
    .eq('candidate_id', candidateId)
    .eq('job_id', jobId)
    .single();

  if (existing) {
    return { error: 'You have already applied to this job' };
  }

  // Create application
  const { data, error } = await supabase
    .from('applications')
    .insert({
      job_id: jobId,
      candidate_id: candidateId,
      cover_letter: coverLetter || null,
      resume_url: resumeUrl || null,
      status: 'applied',
      applied_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating application:', error);
    return { error: 'Failed to submit application. Please try again.' };
  }

  return { applicationId: data.id };
}
