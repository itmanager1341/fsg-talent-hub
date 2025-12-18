'use server';

import { requireAdmin } from '@/lib/auth/requireAuth';
import {
  batchSyncToHubSpot,
  getHubSpotSyncStatus,
  type HubSpotSyncResult,
} from '@/lib/services/employer-prospecting';
import { revalidatePath } from 'next/cache';

/**
 * Trigger HubSpot sync for all pending companies
 */
export async function triggerHubSpotSyncAction(): Promise<{
  success: boolean;
  result?: HubSpotSyncResult;
  error?: string;
}> {
  await requireAdmin();

  try {
    const result = await batchSyncToHubSpot(50);
    revalidatePath('/admin/employer-prospects');
    return { success: true, result };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Get current HubSpot sync status
 */
export async function getHubSpotSyncStatusAction(): Promise<{
  pending: number;
  synced: number;
  error: number;
}> {
  await requireAdmin();
  return getHubSpotSyncStatus();
}
