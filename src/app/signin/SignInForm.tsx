'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/Button';

type AuthMode = 'signin' | 'signup';

export function SignInForm() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      /**
       * Prefer reading values from the submitted form.
       *
       * This keeps the handler resilient in cases where browser automation or
       * password managers populate the DOM value but React state lags behind.
       */
      const form = e.currentTarget as HTMLFormElement;
      const formData = new FormData(form);
      const submittedEmail =
        (typeof formData.get('email') === 'string'
          ? String(formData.get('email'))
          : email
        ).trim();
      const submittedPassword =
        typeof formData.get('password') === 'string'
          ? String(formData.get('password'))
          : password;

      if (mode === 'signin') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: submittedEmail,
          password: submittedPassword,
        });

        if (error) {
          // Helpful for debugging weird “nothing happens” cases in dev.
          const debug = {
            message: error.message,
            status: (error as unknown as { status?: number }).status,
            name: (error as unknown as { name?: string }).name,
          };
          console.error('Supabase sign-in error:', JSON.stringify(debug));
          setError(error.message || 'Sign-in failed. Please try again.');
        } else if (!data?.session) {
          // In some edge cases Supabase can fail without surfacing an error.
          // Make sure the user sees *something*.
          console.error(
            'Supabase sign-in returned no session and no error:',
            JSON.stringify({ data })
          );
          setError(
            'Sign-in did not complete. Please try again (or refresh the page).'
          );
        } else {
          router.push('/account');
          router.refresh();
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: submittedEmail,
          password: submittedPassword,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) {
          const debug = {
            message: error.message,
            status: (error as unknown as { status?: number }).status,
            name: (error as unknown as { name?: string }).name,
          };
          console.error('Supabase sign-up error:', JSON.stringify(debug));
          setError(error.message || 'Sign-up failed. Please try again.');
        } else {
          console.info('Supabase sign-up result:', data);
          setMessage(
            'Check your email for a confirmation link to complete your registration.'
          );
        }
      }
    } catch (err) {
      console.error('Unexpected auth error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
            {message}
          </div>
        )}

        <Button type="submit" disabled={loading} className="w-full">
          {loading
            ? 'Loading...'
            : mode === 'signin'
              ? 'Sign In'
              : 'Create Account'}
        </Button>
      </form>

      <div className="mt-4 text-center text-sm text-gray-600">
        {mode === 'signin' ? (
          <>
            Don&apos;t have an account?{' '}
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
                setMessage(null);
              }}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign up
            </button>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
                setMessage(null);
              }}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign in
            </button>
          </>
        )}
      </div>
    </div>
  );
}
