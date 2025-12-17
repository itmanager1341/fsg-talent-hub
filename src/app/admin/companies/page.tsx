import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { setCompanyActive, setCompanyVerified } from './actions';

export const metadata = {
  title: 'Admin Companies | FSG Talent Hub',
};

interface CompaniesSearchParams {
  status?: 'all' | 'active' | 'inactive';
  verified?: 'all' | 'verified' | 'unverified';
}

interface CompanyRow {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

async function getCompanies(searchParams: CompaniesSearchParams): Promise<CompanyRow[]> {
  const supabase = await createClient();

  let query = supabase
    .from('companies')
    .select('id, name, slug, is_active, is_verified, created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  if (searchParams.status === 'active') query = query.eq('is_active', true);
  if (searchParams.status === 'inactive') query = query.eq('is_active', false);

  if (searchParams.verified === 'verified') query = query.eq('is_verified', true);
  if (searchParams.verified === 'unverified') query = query.eq('is_verified', false);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data || []) as CompanyRow[];
}

export default async function AdminCompaniesPage({
  searchParams,
}: {
  searchParams: Promise<CompaniesSearchParams>;
}) {
  const params = await searchParams;
  const companies = await getCompanies(params);

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
        <p className="mt-1 text-gray-600">
          Verify and activate/deactivate employer companies.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Link href="/admin/companies">
          <Button variant="outline" size="sm">
            All
          </Button>
        </Link>
        <Link href="/admin/companies?verified=unverified">
          <Button variant="outline" size="sm">
            Unverified
          </Button>
        </Link>
        <Link href="/admin/companies?verified=verified">
          <Button variant="outline" size="sm">
            Verified
          </Button>
        </Link>
        <Link href="/admin/companies?status=inactive">
          <Button variant="outline" size="sm">
            Inactive
          </Button>
        </Link>
      </div>

      {/* Content */}
      <Card>
          <CardContent className="pt-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">{companies.length} companies</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Slug</th>
                    <th className="py-2 pr-4">Verified</th>
                    <th className="py-2 pr-4">Active</th>
                    <th className="py-2 pr-4">Created</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((company) => (
                    <tr key={company.id} className="border-b border-gray-100">
                      <td className="py-3 pr-4 font-medium text-gray-900">
                        {company.name}
                      </td>
                      <td className="py-3 pr-4 text-gray-600">{company.slug}</td>
                      <td className="py-3 pr-4">
                        {company.is_verified ? (
                          <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                            Verified
                          </span>
                        ) : (
                          <span className="rounded-full bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800">
                            Unverified
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        {company.is_active ? (
                          <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                            Active
                          </span>
                        ) : (
                          <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-gray-600">
                        {new Date(company.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <form
                            action={setCompanyVerified.bind(
                              null,
                              company.id,
                              !company.is_verified
                            )}
                          >
                            <Button variant="outline" size="sm" type="submit">
                              {company.is_verified ? 'Unverify' : 'Verify'}
                            </Button>
                          </form>
                          <form
                            action={setCompanyActive.bind(
                              null,
                              company.id,
                              !company.is_active
                            )}
                          >
                            <Button variant="outline" size="sm" type="submit">
                              {company.is_active ? 'Deactivate' : 'Activate'}
                            </Button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {companies.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-gray-600">
                        No companies match the current filters.
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

