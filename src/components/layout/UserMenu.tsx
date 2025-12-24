'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface UserMenuProps {
  email: string;
  role?: 'employer' | 'candidate' | 'both' | null;
  isAdmin?: boolean;
}

export function UserMenu({ email, role, isAdmin }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menu on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleSignOut = async () => {
    setIsOpen(false);
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const closeMenu = () => setIsOpen(false);

  const isCandidate = role === 'candidate' || role === 'both';
  const isEmployer = role === 'employer' || role === 'both';

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700">
          {email.charAt(0).toUpperCase()}
        </span>
        <svg
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-64 origin-top-right rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {/* User info section */}
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="truncate text-sm font-medium text-gray-900">{email}</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {isAdmin && (
                <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800">
                  Admin
                </span>
              )}
              {isEmployer && (
                <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                  Employer
                </span>
              )}
              {isCandidate && (
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                  Candidate
                </span>
              )}
              {!role && !isAdmin && (
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                  No profile yet
                </span>
              )}
            </div>
          </div>

          {/* Admin section */}
          {isAdmin && (
            <div className="border-b border-gray-100 py-1">
              <p className="px-4 py-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Admin
              </p>
              <Link
                href="/admin"
                onClick={closeMenu}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Admin Dashboard
              </Link>
            </div>
          )}

          {/* Candidate section */}
          {isCandidate && (
            <div className="border-b border-gray-100 py-1">
              <p className="px-4 py-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Candidate
              </p>
              <Link
                href="/account/candidate"
                onClick={closeMenu}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Dashboard
              </Link>
              <Link
                href="/account/candidate/applications"
                onClick={closeMenu}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                My Applications
              </Link>
              <Link
                href="/account/candidate/saved"
                onClick={closeMenu}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Saved Jobs
              </Link>
              <Link
                href="/account/candidate/resume"
                onClick={closeMenu}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Resume Builder
              </Link>
              <Link
                href="/account/candidate/profile"
                onClick={closeMenu}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Edit Profile
              </Link>
            </div>
          )}

          {/* Employer section */}
          {isEmployer && (
            <div className="border-b border-gray-100 py-1">
              <p className="px-4 py-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Employer
              </p>
              <Link
                href="/employers/dashboard"
                onClick={closeMenu}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Dashboard
              </Link>
              <Link
                href="/employers/jobs/new"
                onClick={closeMenu}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Post a Job
              </Link>
              <Link
                href="/employers/candidates"
                onClick={closeMenu}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Browse Candidates
              </Link>
              <Link
                href="/employers/settings"
                onClick={closeMenu}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Company Settings
              </Link>
            </div>
          )}

          {/* No role yet - prompt to set up */}
          {!role && !isAdmin && (
            <div className="border-b border-gray-100 py-1">
              <p className="px-4 py-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Get Started
              </p>
              <Link
                href="/account/candidate/setup"
                onClick={closeMenu}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Set up as Candidate
              </Link>
              <Link
                href="/employers/setup"
                onClick={closeMenu}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Set up as Employer
              </Link>
            </div>
          )}

          {/* Sign out */}
          <div className="py-1">
            <button
              onClick={handleSignOut}
              className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
