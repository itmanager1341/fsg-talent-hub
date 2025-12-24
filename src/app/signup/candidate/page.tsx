import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth/requireAuth';
import { CandidateSignUpForm } from './SignUpForm';

export const metadata = {
  title: 'Sign Up as Candidate | FSG Talent Hub',
  description: 'Create your candidate account to start applying for jobs.',
};

export default async function CandidateSignUpPage() {
  const user = await getUser();

  // Redirect to account if already signed in
  if (user) {
    redirect('/account');
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Create Your Candidate Account
          </h1>
          <p className="mt-2 text-gray-600">
            Sign up to find your next opportunity in financial services,
            mortgage servicing, and M&A advisory.
          </p>
        </div>
        <CandidateSignUpForm />
        <div className="mt-6 text-center text-sm text-gray-500">
          Hiring talent?{' '}
          <a
            href="/signup/employer"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Sign up as an employer
          </a>
        </div>
      </div>
    </div>
  );
}

