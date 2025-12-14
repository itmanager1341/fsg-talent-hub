'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/requireAuth';

interface ActionResult {
  error?: string;
  success?: boolean;
}

export async function toggleSaveJob(
  jobId: string,
  candidateId: string,
  currentlySaved: boolean
): Promise<ActionResult> {
  const user = await requireAuth();
  const supabase = await createClient();

  // Verify candidate ownership
  const { data: candidate } = await supabase
    .from('candidates')
    .select('id, user_id')
    .eq('id', candidateId)
    .single();

  if (!candidate || candidate.user_id !== user.id) {
    return { error: 'Unauthorized' };
  }

  if (currentlySaved) {
    // Remove from saved jobs
    const { error } = await supabase
      .from('saved_jobs')
      .delete()
      .eq('candidate_id', candidateId)
      .eq('job_id', jobId);

    if (error) {
      console.error('Error removing saved job:', error);
      return { error: 'Failed to remove saved job' };
    }
  } else {
    // Add to saved jobs
    const { error } = await supabase.from('saved_jobs').insert({
      candidate_id: candidateId,
      job_id: jobId,
    });

    if (error) {
      // Handle duplicate key error gracefully
      if (error.code === '23505') {
        return { success: true };
      }
      console.error('Error saving job:', error);
      return { error: 'Failed to save job' };
    }
  }

  return { success: true };
}

export async function checkJobSaved(
  jobId: string,
  candidateId: string
): Promise<boolean> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('saved_jobs')
    .select('id')
    .eq('candidate_id', candidateId)
    .eq('job_id', jobId)
    .single();

  return !!data;
}
