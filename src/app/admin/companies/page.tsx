import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { setCompanyActive, setCompanyVerified } from './actions';
import { TierSelector } from './TierSelector';

export const metadata = {
  title: 'Admin Companies | FSG Talent Hub',
};

interface CompaniesSearchParams {
  status?: 'all' | 'active' | 'inactive';
  verified?: 'all' | 'verified' | 'unverified';
  type?: 'all' | 'employer' | 'prospecting';
}

interface CompanyRow {
  id: string;
  name: string;
  slug: string;
  tier: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  company_type: 'employer' | 'prospecting';
  user_count: number;
  job_count: number;
}

async function getCompanies(searchParams: CompaniesSearchParams): Promise<CompanyRow[]> {
  const supabase = await createClient();

  // Fetch companies with basic filters
  let query = supabase
    .from('companies')
    .select('id, name, slug, tier, is_active, is_verified, created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  if (searchParams.status === 'active') query = query.eq('is_active', true);
  if (searchParams.status === 'inactive') query = query.eq('is_active', false);

  if (searchParams.verified === 'verified') query = query.eq('is_verified', true);
  if (searchParams.verified === 'unverified') query = query.eq('is_verified', false);

  const { data: companies, error } = await query;
  if (error) throw new Error(error.message);
  if (!companies || companies.length === 0) return [];

  // Fetch user counts and job counts for all companies
  const companyIds = companies.map((c) => c.id);

  // Get user counts
  const { data: userCounts } = await supabase
    .from('company_users')
    .select('company_id')
    .in('company_id', companyIds);

  // Get job counts
  const { data: jobCounts } = await supabase
    .from('jobs')
    .select('company_id')
    .in('company_id', companyIds);

  // Aggregate counts
  const userCountMap = new Map<string, number>();
  const jobCountMap = new Map<string, number>();

  userCounts?.forEach((uc) => {
    userCountMap.set(uc.company_id, (userCountMap.get(uc.company_id) || 0) + 1);
  });

  jobCounts?.forEach((jc) => {
    jobCountMap.set(jc.company_id, (jobCountMap.get(jc.company_id) || 0) + 1);
  });

  // Enrich companies with type and counts
  const enriched = companies.map((company) => {
    const userCount = userCountMap.get(company.id) || 0;
    const jobCount = jobCountMap.get(company.id) || 0;
    const companyType: 'employer' | 'prospecting' = userCount > 0 ? 'employer' : 'prospecting';

    return {
      ...company,
      company_type: companyType,
      user_count: userCount,
      job_count: jobCount,
    };
  });

  // Filter by company type if specified
  if (searchParams.type === 'employer') {
    return enriched.filter((c) => c.company_type === 'employer');
  }
  if (searchParams.type === 'prospecting') {
    return enriched.filter((c) => c.company_type === 'prospecting');
  }

  return enriched;
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
        <Link href="/admin/companies?type=employer">
          <Button variant="outline" size="sm">
            Employers
          </Button>
        </Link>
        <Link href="/admin/companies?type=prospecting">
          <Button variant="outline" size="sm">
            Prospecting
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
                    <th className="py-2 pr-4">Type</th>
                    <th className="py-2 pr-4">Tier</th>
                    <th className="py-2 pr-4">Users</th>
                    <th className="py-2 pr-4">Jobs</th>
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
                      <td className="py-3 pr-4">
                        {company.company_type === 'employer' ? (
                          <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                            Employer
                          </span>
                        ) : (
                          <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                            Prospecting
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 capitalize">
                          {company.tier}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-gray-600">
                        {company.user_count}
                      </td>
                      <td className="py-3 pr-4 text-gray-600">
                        {company.job_count}
                      </td>
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
                          <TierSelector companyId={company.id} currentTier={company.tier} />
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
                      <td colSpan={9} className="py-10 text-center text-gray-600">
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

