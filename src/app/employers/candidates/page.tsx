import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireEmployer } from '@/lib/auth/requireAuth';
import { createClient } from '@/lib/supabase/server';
import { CandidateSearch } from './CandidateSearch';

export const metadata = {
  title: 'Resume Database | FSG Talent Hub',
  description: 'Search and discover qualified candidates.',
};

interface Company {
  id: string;
  name: string;
  tier: string;
}

export default async function EmployerCandidatesPage() {
  const { companyUser } = await requireEmployer();
  const company = (
    Array.isArray(companyUser.company)
      ? companyUser.company[0]
      : companyUser.company
  ) as Company;

  // Check tier access - require starter+ for resume database
  const tier = company.tier || 'free';
  if (tier === 'free') {
    redirect('/employers/billing?upgrade=resume-database');
  }

  const supabase = await createClient();

  // Get company's active jobs for the AI matching dropdown
  const { data: activeJobs } = await supabase
    .from('jobs')
    .select('id, title')
    .eq('company_id', company.id)
    .eq('status', 'active')
    .order('title');

  // Get distinct states for filter dropdown
  const { data: states } = await supabase
    .from('candidates')
    .select('state')
    .eq('is_active', true)
    .eq('is_searchable', true)
    .not('state', 'is', null);

  const uniqueStates = [...new Set((states || []).map((s) => s.state).filter(Boolean))].sort();

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link
              href="/employers/dashboard"
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              &larr; Back to Dashboard
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-gray-900">
              Resume Database
            </h1>
            <p className="mt-1 text-gray-600">
              Search and discover qualified candidates for your open positions.
            </p>
          </div>
          <Link
            href="/employers/candidates/saved"
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50"
          >
            View Saved Candidates
          </Link>
        </div>

        {/* Main Content */}
        <CandidateSearch
          companyId={company.id}
          activeJobs={activeJobs || []}
          availableStates={uniqueStates as string[]}
        />
      </div>
    </div>
  );
}
