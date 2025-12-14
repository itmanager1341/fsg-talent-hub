import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/Card';

export const metadata = {
  title: 'Companies | FSG Talent Hub',
  description: 'Explore employers hiring on FSG Talent Hub.',
};

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;
  const q = (params.q || '').trim();

  let query = supabase
    .from('companies')
    .select(
      'id, name, slug, website, industry, headquarters_city, headquarters_state, logo_url'
    )
    .eq('is_active', true)
    .order('name', { ascending: true })
    .limit(200);

  if (q) {
    query = query.ilike('name', `%${q}%`);
  }

  const { data: companies, error } = await query;

  return (
    <div className="bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
          <p className="mt-2 text-gray-600">
            Browse employers hiring on FSG Talent Hub.
          </p>
        </div>

        <form className="mb-6">
          <label className="block text-sm font-medium text-gray-700">
            Search
          </label>
          <div className="mt-2 flex gap-2">
            <input
              name="q"
              defaultValue={q}
              placeholder="Search by company name…"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Search
            </button>
          </div>
        </form>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Failed to load companies: {error.message}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {(companies || []).map((c) => (
            <Card key={c.id} className="transition hover:shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold text-gray-900">
                      <Link href={`/companies/${c.slug}`} className="hover:underline">
                        {c.name}
                      </Link>
                    </h2>
                    <p className="mt-1 text-sm text-gray-600">
                      {c.industry || 'Industry not specified'}
                    </p>
                    <p className="mt-2 text-sm text-gray-500">
                      {c.headquarters_city || c.headquarters_state
                        ? `${c.headquarters_city || ''}${
                            c.headquarters_city && c.headquarters_state ? ', ' : ''
                          }${c.headquarters_state || ''}`.trim()
                        : 'Location not specified'}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <Link
                      href={`/companies/${c.slug}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-500"
                    >
                      View
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {!error && (companies?.length || 0) === 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600">
            No companies found.
          </div>
        )}
      </div>
    </div>
  );
}

