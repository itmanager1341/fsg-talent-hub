import Link from 'next/link';
import { requireEmployer } from '@/lib/auth/requireAuth';
import { JobForm } from '../_components/JobForm';

export const metadata = {
  title: 'Post a Job | FSG Talent Hub',
  description: 'Create a new job posting to find great candidates.',
};

export default async function NewJobPage() {
  const { companyUser } = await requireEmployer();
  const company = Array.isArray(companyUser.company)
    ? companyUser.company[0]
    : companyUser.company;

  return (
    <div className="bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/employers/dashboard"
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            &larr; Back to dashboard
          </Link>
        </div>

        <h1 className="mb-8 text-2xl font-bold text-gray-900">Post a New Job</h1>

        <JobForm companyId={company.id} companyName={company.name} />
      </div>
    </div>
  );
}
