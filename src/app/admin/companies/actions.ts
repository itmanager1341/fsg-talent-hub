'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/requireAuth';

/**
 * Update a company's verification status.
 *
 * This is used by the minimal admin UI. RLS must permit admins to update the
 * `companies` row, typically via an `is_admin()` / `user_roles` check.
 */
export async function setCompanyVerified(companyId: string, verified: boolean) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from('companies')
    .update({ is_verified: verified })
    .eq('id', companyId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/admin/companies');
}

/**
 * Update a company's active status.
 */
export async function setCompanyActive(companyId: string, active: boolean) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from('companies')
    .update({ is_active: active })
    .eq('id', companyId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/admin/companies');
}

/**
 * Update a company's tier.
 * Valid tiers: free, starter, standard, professional, enterprise
 */
export async function setCompanyTier(companyId: string, tier: string) {
  await requireAdmin();
  
  // Validate tier value
  const validTiers = ['free', 'starter', 'standard', 'professional', 'enterprise'];
  if (!validTiers.includes(tier)) {
    throw new Error(`Invalid tier: ${tier}. Must be one of: ${validTiers.join(', ')}`);
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('companies')
    .update({ tier })
    .eq('id', companyId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/admin/companies');
}

