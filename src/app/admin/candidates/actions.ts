'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/requireAuth';

/**
 * Update a candidate's active status.
 *
 * Used by the minimal admin UI. RLS must permit admins to update candidate rows.
 */
export async function setCandidateActive(candidateId: string, active: boolean) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from('candidates')
    .update({ is_active: active })
    .eq('id', candidateId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/admin/candidates');
}

/**
 * Update a candidate's search visibility.
 */
export async function setCandidateSearchable(
  candidateId: string,
  searchable: boolean
) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from('candidates')
    .update({ is_searchable: searchable })
    .eq('id', candidateId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/admin/candidates');
}

