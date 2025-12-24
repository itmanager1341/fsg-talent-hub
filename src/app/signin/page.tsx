import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth/requireAuth';
import { SignInForm } from './SignInForm';

export const metadata = {
  title: 'Sign In | FSG Talent Hub',
  description: 'Sign in or create an account to access FSG Talent Hub.',
};

export default async function SignInPage() {
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
            Welcome to FSG Talent Hub
          </h1>
          <p className="mt-2 text-gray-600">
            Sign in to your account
          </p>
        </div>
        <SignInForm />
      </div>
    </div>
  );
}
