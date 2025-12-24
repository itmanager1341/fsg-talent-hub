import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { UserMenu } from './UserMenu';

interface HeaderProps {
  user?: User | null;
  role?: 'employer' | 'candidate' | 'both' | null;
  isAdmin?: boolean;
}

export function Header({ user, role, isAdmin }: HeaderProps) {
  const canViewCandidates = !!user && (role === 'employer' || role === 'both' || isAdmin);

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
              href="/companies"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Companies
            </Link>
            <Link
              href="/employers"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              For Employers
            </Link>
            {canViewCandidates && (
              <Link
                href="/candidates"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Candidates
              </Link>
            )}
            {user && isAdmin && (
              <Link
                href="/admin"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Admin
              </Link>
            )}
            {user ? (
              <UserMenu
                email={user.email || 'User'}
                role={role}
                isAdmin={isAdmin}
              />
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
