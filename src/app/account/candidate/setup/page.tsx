import { redirect } from 'next/navigation';
import { requireAuth, getUserRole } from '@/lib/auth/requireAuth';
import { CandidateSetupForm } from './CandidateSetupForm';

export const metadata = {
  title: 'Set Up Your Profile | FSG Talent Hub',
  description: 'Create your candidate profile to start applying for jobs.',
};

export default async function CandidateSetupPage() {
  const user = await requireAuth();
  const role = await getUserRole(user.id);

  // If already a candidate, redirect to dashboard
  if (role === 'candidate' || role === 'both') {
    redirect('/account/candidate');
  }

  return (
    <div className="bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Create Your Profile
          </h1>
          <p className="mt-2 text-gray-600">
            Tell us about yourself to get started finding your next opportunity.
          </p>
        </div>

        <CandidateSetupForm userEmail={user.email || ''} />
      </div>
    </div>
  );
}
