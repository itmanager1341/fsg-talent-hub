import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/requireAuth';
import { Card, CardContent } from '@/components/ui/Card';

export const metadata = {
  title: 'Admin | FSG Talent Hub',
};

export default async function AdminHomePage() {
  await requireAdmin();

  return (
    <div className="bg-gray-50">
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin</h1>
          <p className="mt-2 text-gray-600">
            Minimal V0 admin console for approvals and account status.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2">
          <Link href="/admin/companies">
            <Card className="h-full transition hover:shadow-md">
              <CardContent className="pt-6">
                <h2 className="text-lg font-semibold text-gray-900">Companies</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Verify / deactivate employer companies.
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/candidates">
            <Card className="h-full transition hover:shadow-md">
              <CardContent className="pt-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Candidates
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Activate / deactivate candidate accounts and search visibility.
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}

