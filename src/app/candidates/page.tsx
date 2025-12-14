import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireEmployerOrAdmin } from '@/lib/auth/requireAuth';
import { Card, CardContent } from '@/components/ui/Card';

export const metadata = {
  title: 'Candidates | FSG Talent Hub',
  description: 'Browse candidate profiles (employers only).',
};

export default async function CandidatesDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; state?: string }>;
}) {
  await requireEmployerOrAdmin();
  const supabase = await createClient();

  const params = await searchParams;
  const q = (params.q || '').trim();
  const state = (params.state || '').trim().toUpperCase();

  let query = supabase
    .from('candidates')
    .select(
      'id, first_name, last_name, headline, city, state, email, is_searchable, is_active, resume_url'
    )
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(200);

  if (state) {
    query = query.eq('state', state);
  }

  if (q) {
    // Basic search against name/headline. (We can improve later with trgm/FTS.)
    query = query.or(
      `first_name.ilike.%${q}%,last_name.ilike.%${q}%,headline.ilike.%${q}%,email.ilike.%${q}%`
    );
  }

  const { data: candidates, error } = await query;

  return (
    <div className="bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Candidates</h1>
          <p className="mt-2 text-gray-600">
            Browse active candidate profiles.
          </p>
        </div>

        <form className="mb-6 grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Search
            </label>
            <input
              name="q"
              defaultValue={q}
              placeholder="Name, headline, or email…"
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">State</label>
            <input
              name="state"
              defaultValue={state}
              placeholder="e.g. TX"
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="sm:col-span-3">
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Apply filters
            </button>
          </div>
        </form>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Failed to load candidates: {error.message}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {(candidates || []).map((c) => {
            const name =
              c.first_name || c.last_name
                ? `${c.first_name || ''} ${c.last_name || ''}`.trim()
                : 'Candidate';
            const location =
              c.city && c.state ? `${c.city}, ${c.state}` : c.city || c.state || null;

            return (
              <Card key={c.id} className="transition hover:shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-semibold text-gray-900">
                        <Link
                          href={`/candidates/${c.id}`}
                          className="hover:underline"
                        >
                          {name}
                        </Link>
                      </h2>
                      {c.headline && (
                        <p className="mt-1 text-sm text-gray-600">{c.headline}</p>
                      )}
                      <div className="mt-2 text-sm text-gray-500">
                        {c.email ? <span>{c.email}</span> : null}
                        {c.email && location ? <span> · </span> : null}
                        {location ? <span>{location}</span> : null}
                      </div>
                      <div className="mt-2 text-xs text-gray-400">
                        {c.is_searchable ? 'Searchable' : 'Hidden'}
                        {c.resume_url ? ' · Resume on file' : ' · No resume'}
                      </div>
                    </div>
                    <div className="shrink-0">
                      <Link
                        href={`/candidates/${c.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-500"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {!error && (candidates?.length || 0) === 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600">
            No candidates found.
          </div>
        )}
      </div>
    </div>
  );
}

