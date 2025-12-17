'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/requireAuth';

interface UpdateFlagInput {
  enabled?: boolean;
  config?: Record<string, unknown>;
}

interface ActionResult {
  error?: string;
  success?: boolean;
}

export async function updateFeatureFlag(
  flagId: string,
  updates: UpdateFlagInput
): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();

  // Build update object
  const updateData: Record<string, unknown> = {};

  if (updates.enabled !== undefined) {
    updateData.enabled = updates.enabled;
  }

  if (updates.config !== undefined) {
    updateData.config = updates.config;
  }

  if (Object.keys(updateData).length === 0) {
    return { error: 'No updates provided' };
  }

  const { error } = await supabase
    .from('feature_flags')
    .update(updateData)
    .eq('id', flagId);

  if (error) {
    console.error('Error updating feature flag:', error);
    return { error: 'Failed to update feature flag' };
  }

  return { success: true };
}
