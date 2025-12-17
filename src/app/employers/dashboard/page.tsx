import Link from 'next/link';
import { requireEmployer } from '@/lib/auth/requireAuth';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { SignOutButton } from '@/app/account/SignOutButton';

export const metadata = {
  title: 'Employer Dashboard | FSG Talent Hub',
  description: 'Manage your job postings and view applications.',
};

interface Job {
  id: string;
  title: string;
  status: string;
  view_count: number;
  apply_count: number;
  published_at: string | null;
  created_at: string;
}

interface Company {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  tier: string;
}

async function getCompanyJobs(companyId: string): Promise<Job[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('jobs')
    .select(
      'id, title, status, view_count, apply_count, published_at, created_at'
    )
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching jobs:', error);
    return [];
  }

  return data || [];
}

async function getRecentApplications(companyId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('applications')
    .select(
      `
      id,
      status,
      applied_at,
      candidate:candidates(first_name, last_name),
      job:jobs!inner(id, title, company_id)
    `
    )
    .eq('job.company_id', companyId)
    .order('applied_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching applications:', error);
    return [];
  }

  return data || [];
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  active: 'bg-green-100 text-green-700',
  paused: 'bg-yellow-100 text-yellow-700',
  closed: 'bg-red-100 text-red-700',
  expired: 'bg-gray-100 text-gray-500',
};

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  active: 'Active',
  paused: 'Paused',
  closed: 'Closed',
  expired: 'Expired',
};

function formatDate(dateString: string | null): string {
  if (!dateString) return 'Not published';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default async function EmployerDashboardPage() {
  const { user, companyUser } = await requireEmployer();
  const company = (
    Array.isArray(companyUser.company)
      ? companyUser.company[0]
      : companyUser.company
  ) as Company;

  const [jobs, recentApplications] = await Promise.all([
    getCompanyJobs(company.id),
    getRecentApplications(company.id),
  ]);

  const activeJobs = jobs.filter((j) => j.status === 'active').length;
  const totalApplications = jobs.reduce((sum, j) => sum + j.apply_count, 0);
  const totalViews = jobs.reduce((sum, j) => sum + j.view_count, 0);

  return (
    <div className="bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
            <p className="mt-1 text-gray-600">{user.email}</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/employers/jobs/new">
              <Button>Post a Job</Button>
            </Link>
            <SignOutButton />
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-gray-500">Active Jobs</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {activeJobs}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-gray-500">Total Jobs</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {jobs.length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-gray-500">
                Total Applications
              </p>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {totalApplications}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-gray-500">Total Views</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {totalViews}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Resume Database CTA */}
        <Card className="mb-8 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <h3 className="font-semibold text-gray-900">Resume Database</h3>
              <p className="mt-1 text-sm text-gray-600">
                Search qualified candidates and invite them to apply for your open positions.
              </p>
            </div>
            {company.tier === 'free' ? (
              <Link href="/employers/billing?upgrade=resume-database">
                <Button variant="outline">Upgrade to Access</Button>
              </Link>
            ) : (
              <Link href="/employers/candidates">
                <Button>Search Candidates</Button>
              </Link>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Jobs List */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Your Jobs
                  </h2>
                  <Link href="/employers/jobs/new">
                    <Button size="sm">Post New Job</Button>
                  </Link>
                </div>

                {jobs.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-gray-500">No jobs posted yet</p>
                    <Link
                      href="/employers/jobs/new"
                      className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-500"
                    >
                      Post your first job
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {jobs.map((job) => (
                      <div
                        key={job.id}
                        className="flex items-center justify-between py-4"
                      >
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/employers/jobs/${job.id}/edit`}
                            className="font-medium text-gray-900 hover:text-blue-600"
                          >
                            {job.title}
                          </Link>
                          <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[job.status] || 'bg-gray-100 text-gray-700'}`}
                            >
                              {statusLabels[job.status] || job.status}
                            </span>
                            <span>{job.view_count} views</span>
                            <span>{job.apply_count} applications</span>
                          </div>
                        </div>
                        <div className="ml-4 flex items-center gap-2">
                          {job.apply_count > 0 && (
                            <Link
                              href={`/employers/jobs/${job.id}/applications`}
                              className="text-sm text-blue-600 hover:text-blue-500"
                            >
                              View Applicants
                            </Link>
                          )}
                          <Link
                            href={`/employers/jobs/${job.id}/edit`}
                            className="text-sm text-gray-500 hover:text-gray-700"
                          >
                            Edit
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Applications */}
          <div>
            <Card>
              <CardContent className="pt-6">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                  Recent Applications
                </h2>

                {recentApplications.length === 0 ? (
                  <p className="py-4 text-center text-sm text-gray-500">
                    No applications yet
                  </p>
                ) : (
                  <div className="space-y-4">
                    {recentApplications.map((app: {
                      id: string;
                      applied_at: string;
                      candidate: { first_name: string; last_name: string } | { first_name: string; last_name: string }[] | null;
                      job: { id: string; title: string } | { id: string; title: string }[] | null;
                    }) => {
                      const candidate = Array.isArray(app.candidate)
                        ? app.candidate[0]
                        : app.candidate;
                      const job = Array.isArray(app.job)
                        ? app.job[0]
                        : app.job;

                      return (
                        <div
                          key={app.id}
                          className="border-b border-gray-100 pb-4 last:border-0 last:pb-0"
                        >
                          <p className="font-medium text-gray-900">
                            {candidate?.first_name} {candidate?.last_name}
                          </p>
                          {job && (
                            <Link
                              href={`/employers/jobs/${job.id}/applications`}
                              className="text-sm text-gray-500 hover:text-blue-600"
                            >
                              Applied for {job.title}
                            </Link>
                          )}
                          <p className="text-xs text-gray-400">
                            {formatDate(app.applied_at)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Company Settings */}
            <Card className="mt-4">
              <CardContent className="pt-6">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                  Company Settings
                </h2>
                <div className="space-y-2">
                  <Link
                    href="/employers/settings"
                    className="block text-sm text-blue-600 hover:text-blue-500"
                  >
                    Edit Company Profile
                  </Link>
                  <Link
                    href="/employers/team"
                    className="block text-sm text-blue-600 hover:text-blue-500"
                  >
                    Manage Team
                  </Link>
                  <Link
                    href="/employers/billing"
                    className="block text-sm text-blue-600 hover:text-blue-500"
                  >
                    Billing & Subscription
                  </Link>
                </div>
                <div className="mt-4 rounded-lg bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">Current Plan</p>
                  <Link
                    href="/employers/billing"
                    className="font-medium capitalize text-gray-900 hover:text-blue-600"
                  >
                    {company.tier || 'Free'} &rarr;
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
