import { redirect } from 'next/navigation';
import { requireAuth, getUserRole } from '@/lib/auth/requireAuth';
import { CompanySetupForm } from './CompanySetupForm';

export const metadata = {
  title: 'Set Up Your Company | FSG Talent Hub',
  description: 'Create your company profile to start posting jobs.',
};

export default async function EmployerSetupPage() {
  const user = await requireAuth();
  const role = await getUserRole(user.id);

  // If already an employer, redirect to dashboard
  if (role === 'employer' || role === 'both') {
    redirect('/employers/dashboard');
  }

  return (
    <div className="bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Set Up Your Company
          </h1>
          <p className="mt-2 text-gray-600">
            Create your company profile to start posting jobs and finding great
            candidates.
          </p>
        </div>

        <CompanySetupForm userEmail={user.email || ''} />
      </div>
    </div>
  );
}
