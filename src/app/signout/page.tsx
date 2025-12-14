'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

/**
 * Client-side sign-out route.
 *
 * This provides a deterministic way to clear the Supabase auth cookies so we can
 * switch between test users during local/manual QA.
 */
export default function SignOutPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) throw signOutError;
        if (!cancelled) router.replace('/signin');
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to sign out');
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <h1 className="text-xl font-semibold text-gray-900">Signing out…</h1>
      <p className="mt-2 text-sm text-gray-600">
        Clearing your session and redirecting to Sign In.
      </p>
      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}

