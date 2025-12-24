import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth/requireAuth';
import { EmployerSignUpForm } from './SignUpForm';

export const metadata = {
  title: 'Sign Up as Employer | FSG Talent Hub',
  description: 'Create your employer account to start posting jobs and finding talent.',
};

export default async function EmployerSignUpPage() {
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
            Create Your Employer Account
          </h1>
          <p className="mt-2 text-gray-600">
            Sign up to post jobs and connect with qualified candidates in
            financial services.
          </p>
        </div>
        <EmployerSignUpForm />
        <div className="mt-6 text-center text-sm text-gray-500">
          Looking for a job?{' '}
          <a
            href="/signup/candidate"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Sign up as a candidate
          </a>
        </div>
      </div>
    </div>
  );
}

