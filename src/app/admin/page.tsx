import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';

export const metadata = {
  title: 'Admin | FSG Talent Hub',
};

export default function AdminHomePage() {
  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-gray-600">
          Welcome to the FSG Talent Hub admin console.
        </p>
      </div>

      {/* Quick Links Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/admin/companies">
          <Card className="h-full transition hover:border-blue-300 hover:shadow-md">
            <CardContent className="pt-6">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Companies</h2>
              <p className="mt-1 text-sm text-gray-600">
                Verify and manage employer companies.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/candidates">
          <Card className="h-full transition hover:border-green-300 hover:shadow-md">
            <CardContent className="pt-6">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Candidates</h2>
              <p className="mt-1 text-sm text-gray-600">
                Manage candidate accounts and visibility.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/ai-usage">
          <Card className="h-full transition hover:border-purple-300 hover:shadow-md">
            <CardContent className="pt-6">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
                <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">AI Usage</h2>
              <p className="mt-1 text-sm text-gray-600">
                Monitor AI feature usage, costs, and rate limits.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/hubspot">
          <Card className="h-full transition hover:border-orange-300 hover:shadow-md">
            <CardContent className="pt-6">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50">
                <svg className="h-5 w-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">HubSpot Sync</h2>
              <p className="mt-1 text-sm text-gray-600">
                Sync companies from HubSpot CRM.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/settings">
          <Card className="h-full transition hover:border-gray-400 hover:shadow-md">
            <CardContent className="pt-6">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
              <p className="mt-1 text-sm text-gray-600">
                Manage feature flags and configuration.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}

