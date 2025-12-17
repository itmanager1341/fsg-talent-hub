import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireEmployer } from '@/lib/auth/requireAuth';
import { getSavedCandidates } from '../actions';
import { SavedCandidatesList } from './SavedCandidatesList';

export const metadata = {
  title: 'Saved Candidates | FSG Talent Hub',
  description: 'View and manage your saved candidates.',
};

interface Company {
  id: string;
  name: string;
  tier: string;
}

export default async function SavedCandidatesPage() {
  const { companyUser } = await requireEmployer();
  const company = (
    Array.isArray(companyUser.company)
      ? companyUser.company[0]
      : companyUser.company
  ) as Company;

  // Check tier access
  const tier = company.tier || 'free';
  if (tier === 'free') {
    redirect('/employers/billing?upgrade=resume-database');
  }

  const { candidates, error } = await getSavedCandidates();

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/employers/candidates"
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            &larr; Back to Resume Database
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">
            Saved Candidates
          </h1>
          <p className="mt-1 text-gray-600">
            Candidates you&apos;ve saved for later review.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {candidates.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Saved Candidates
            </h3>
            <p className="text-gray-600 mb-4">
              Browse the resume database to find and save candidates.
            </p>
            <Link
              href="/employers/candidates"
              className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Search Candidates
            </Link>
          </div>
        ) : (
          <SavedCandidatesList initialCandidates={candidates} />
        )}
      </div>
    </div>
  );
}
