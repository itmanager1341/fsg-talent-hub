'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/requireAuth';

interface ActionResult {
  error?: string;
  success?: boolean;
}

export async function removeSavedJob(
  savedJobId: string,
  candidateId: string
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

  // Delete saved job
  const { error } = await supabase
    .from('saved_jobs')
    .delete()
    .eq('id', savedJobId)
    .eq('candidate_id', candidateId);

  if (error) {
    console.error('Error removing saved job:', error);
    return { error: 'Failed to remove saved job' };
  }

  return { success: true };
}
