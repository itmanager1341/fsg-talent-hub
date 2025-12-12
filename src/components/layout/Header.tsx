import Link from 'next/link';
import type { User } from '@supabase/supabase-js';

interface HeaderProps {
  user?: User | null;
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="border-b border-gray-200 bg-white">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="text-xl font-semibold text-gray-900">
            FSG Talent Hub
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/jobs"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Find Jobs
            </Link>
            <Link
              href="/employers"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              For Employers
            </Link>
            {user ? (
              <Link
                href="/account"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Account
              </Link>
            ) : (
              <Link
                href="/signin"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
