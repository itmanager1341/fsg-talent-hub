import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { setCandidateActive, setCandidateSearchable } from './actions';

export const metadata = {
  title: 'Admin Candidates | FSG Talent Hub',
};

interface CandidatesSearchParams {
  status?: 'all' | 'active' | 'inactive';
  searchable?: 'all' | 'searchable' | 'hidden';
}

interface CandidateRow {
  id: string;
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  is_active: boolean;
  is_searchable: boolean;
  created_at: string;
}

async function getCandidates(
  searchParams: CandidatesSearchParams
): Promise<CandidateRow[]> {
  const supabase = await createClient();

  let query = supabase
    .from('candidates')
    .select(
      'id, user_id, email, first_name, last_name, is_active, is_searchable, created_at'
    )
    .order('created_at', { ascending: false })
    .limit(200);

  if (searchParams.status === 'active') query = query.eq('is_active', true);
  if (searchParams.status === 'inactive') query = query.eq('is_active', false);

  if (searchParams.searchable === 'searchable')
    query = query.eq('is_searchable', true);
  if (searchParams.searchable === 'hidden')
    query = query.eq('is_searchable', false);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data || []) as CandidateRow[];
}

export default async function AdminCandidatesPage({
  searchParams,
}: {
  searchParams: Promise<CandidatesSearchParams>;
}) {
  const params = await searchParams;
  const candidates = await getCandidates(params);

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Candidates</h1>
        <p className="mt-1 text-gray-600">
          Activate/deactivate candidates and control resume search visibility.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Link href="/admin/candidates">
          <Button variant="outline" size="sm">
            All
          </Button>
        </Link>
        <Link href="/admin/candidates?status=inactive">
          <Button variant="outline" size="sm">
            Inactive
          </Button>
        </Link>
        <Link href="/admin/candidates?searchable=hidden">
          <Button variant="outline" size="sm">
            Hidden from search
          </Button>
        </Link>
      </div>

      {/* Content */}
      <Card>
          <CardContent className="pt-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {candidates.length} candidates
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">Active</th>
                    <th className="py-2 pr-4">Searchable</th>
                    <th className="py-2 pr-4">Created</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((candidate) => {
                    const displayName =
                      candidate.first_name || candidate.last_name
                        ? `${candidate.first_name ?? ''} ${candidate.last_name ?? ''}`.trim()
                        : '—';

                    return (
                      <tr key={candidate.id} className="border-b border-gray-100">
                        <td className="py-3 pr-4 font-medium text-gray-900">
                          {displayName}
                        </td>
                        <td className="py-3 pr-4 text-gray-600">{candidate.email}</td>
                        <td className="py-3 pr-4">
                          {candidate.is_active ? (
                            <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                              Active
                            </span>
                          ) : (
                            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          {candidate.is_searchable ? (
                            <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                              Searchable
                            </span>
                          ) : (
                            <span className="rounded-full bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800">
                              Hidden
                            </span>
                          )}
                        </td>
                        <td className="py-3 pr-4 text-gray-600">
                          {new Date(candidate.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <form
                              action={setCandidateActive.bind(
                                null,
                                candidate.id,
                                !candidate.is_active
                              )}
                            >
                              <Button variant="outline" size="sm" type="submit">
                                {candidate.is_active ? 'Deactivate' : 'Activate'}
                              </Button>
                            </form>
                            <form
                              action={setCandidateSearchable.bind(
                                null,
                                candidate.id,
                                !candidate.is_searchable
                              )}
                            >
                              <Button variant="outline" size="sm" type="submit">
                                {candidate.is_searchable
                                  ? 'Hide'
                                  : 'Make searchable'}
                              </Button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {candidates.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-gray-600">
                        No candidates match the current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}

