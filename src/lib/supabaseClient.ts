import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Browser-side Supabase client.
 *
 * Important: this uses cookie-based auth via `@supabase/ssr` so that Server
 * Components (which read auth from cookies) can see the session immediately
 * after `signInWithPassword()` / `signOut()`.
 *
 * If you use `@supabase/supabase-js` directly in the browser, it will default
 * to localStorage auth which does NOT propagate to the server render layer,
 * causing sign-in to appear to “do nothing” (redirect loops back to /signin).
 */
export const supabase: SupabaseClient = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
