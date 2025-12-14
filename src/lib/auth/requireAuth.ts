import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { User } from '@supabase/supabase-js';

/**
 * Require authenticated user. Redirects to /signin if not logged in.
 * Use in Server Components and Route Handlers.
 */
export async function requireAuth(): Promise<User> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signin');
  }

  return user;
}

/**
 * Get current user without redirecting.
 * Returns null if not authenticated.
 */
export async function getUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

/**
 * Require employer role. Checks for company_users row.
 * Redirects to /account?setup=employer if no company association.
 */
export async function requireEmployer() {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: companyUser } = await supabase
    .from('company_users')
    .select(
      `
      *,
      company:companies(*)
    `
    )
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (!companyUser) {
    redirect('/account?setup=employer');
  }

  return { user, companyUser };
}

/**
 * Require candidate role. Checks for candidates row.
 * Redirects to /account?setup=candidate if no candidate profile.
 */
export async function requireCandidate() {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: candidate } = await supabase
    .from('candidates')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (!candidate) {
    redirect('/account?setup=candidate');
  }

  return { user, candidate };
}

/**
 * Get user's role based on their table presence.
 * Returns 'employer' | 'candidate' | 'both' | null
 */
export async function getUserRole(
  userId: string
): Promise<'employer' | 'candidate' | 'both' | null> {
  const supabase = await createClient();

  const [{ data: companyUser }, { data: candidate }] = await Promise.all([
    supabase
      .from('company_users')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single(),
    supabase
      .from('candidates')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single(),
  ]);

  const isEmployer = !!companyUser;
  const isCandidate = !!candidate;

  if (isEmployer && isCandidate) return 'both';
  if (isEmployer) return 'employer';
  if (isCandidate) return 'candidate';
  return null;
}

/**
 * Returns true if the user is an admin.
 *
 * Admin role is modeled via `public.user_roles` (role='admin').
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .maybeSingle();

  if (error) {
    // If RLS prevents this read, default to non-admin.
    return false;
  }

  return !!data;
}

/**
 * Require user to be either an employer (company_users row) or an admin.
 * Redirects to /account (role setup) if the user is neither.
 */
export async function requireEmployerOrAdmin(): Promise<
  | { user: User; access: 'admin' }
  | { user: User; access: 'employer'; companyUserId: string; companyId: string }
> {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: adminRow, error: adminError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle();

  if (!adminError && adminRow) {
    return { user, access: 'admin' };
  }

  const { data: companyUser } = await supabase
    .from('company_users')
    .select('id, company_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (!companyUser) {
    redirect('/account');
  }

  return {
    user,
    access: 'employer',
    companyUserId: companyUser.id,
    companyId: companyUser.company_id,
  };
}

/**
 * Require admin role.
 *
 * V0 note: Admin role is implemented via a `public.user_roles` table with
 * `{ user_id, role }` rows (role='admin'). RLS must allow the signed-in user
 * to read their own `user_roles` row; updates are handled via SQL/service role.
 */
export async function requireAdmin(): Promise<User> {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: roleRow, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .single();

  if (error || !roleRow) {
    redirect('/');
  }

  return user;
}
