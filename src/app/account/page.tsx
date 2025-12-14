import { redirect } from 'next/navigation';
import { requireAuth, getUserRole, isAdmin } from '@/lib/auth/requireAuth';
import { SignOutButton } from './SignOutButton';

export const metadata = {
  title: 'Account | FSG Talent Hub',
  description: 'Manage your FSG Talent Hub account.',
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ setup?: string }>;
}) {
  const user = await requireAuth();
  const [role, admin] = await Promise.all([getUserRole(user.id), isAdmin(user.id)]);
  const params = await searchParams;

  if (admin && !params.setup) {
    redirect('/admin');
  }

  // If user has a role and no setup param, redirect to appropriate dashboard
  if (role && !params.setup) {
    if (role === 'employer' || role === 'both') {
      redirect('/employers/dashboard');
    } else if (role === 'candidate') {
      redirect('/account/candidate');
    }
  }

  // Show role selection for new users or when setup param is present
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome!</h1>
        <p className="mt-2 text-gray-600">
          Signed in as <span className="font-medium">{user.email}</span>
        </p>
      </div>

      {!role && (
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            How would you like to use FSG Talent Hub?
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <a
              href="/account/candidate/setup"
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition hover:border-blue-500 hover:shadow-md"
            >
              <h3 className="font-semibold text-gray-900">
                I&apos;m looking for a job
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Create your candidate profile, upload your resume, and apply to
                jobs.
              </p>
            </a>
            <a
              href="/employers/setup"
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition hover:border-blue-500 hover:shadow-md"
            >
              <h3 className="font-semibold text-gray-900">
                I&apos;m hiring talent
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Set up your company profile and post jobs to find great
                candidates.
              </p>
            </a>
          </div>
        </div>
      )}

      {role && (
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Your Profile
          </h2>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-600">
              Role:{' '}
              <span className="font-medium capitalize text-gray-900">
                {role}
              </span>
            </p>
            <div className="mt-4 flex gap-4">
              {(role === 'candidate' || role === 'both') && (
                <a
                  href="/account/candidate"
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  Candidate Dashboard
                </a>
              )}
              {(role === 'employer' || role === 'both') && (
                <a
                  href="/employers/dashboard"
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  Employer Dashboard
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      <SignOutButton />
    </div>
  );
}
