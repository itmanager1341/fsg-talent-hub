import Link from 'next/link';
import { requireCandidate } from '@/lib/auth/requireAuth';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { SignOutButton } from '../SignOutButton';

export const metadata = {
  title: 'Dashboard | FSG Talent Hub',
  description: 'Manage your job search, applications, and profile.',
};

interface Application {
  id: string;
  status: string;
  applied_at: string;
  job: {
    id: string;
    title: string;
    company: { name: string } | null;
  } | null;
}

interface SavedJob {
  id: string;
  created_at: string;
  job: {
    id: string;
    title: string;
    company: { name: string } | null;
    location_city: string | null;
    location_state: string | null;
    work_setting: string;
  } | null;
}

async function getCandidateData(candidateId: string) {
  const supabase = await createClient();

  const [applicationsResult, savedJobsResult] = await Promise.all([
    supabase
      .from('applications')
      .select(
        `
        id,
        status,
        applied_at,
        job:jobs(id, title, company:companies(name))
      `
      )
      .eq('candidate_id', candidateId)
      .order('applied_at', { ascending: false })
      .limit(5),
    supabase
      .from('saved_jobs')
      .select(
        `
        id,
        created_at,
        job:jobs(id, title, company:companies(name), location_city, location_state, work_setting)
      `
      )
      .eq('candidate_id', candidateId)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  return {
    applications: (applicationsResult.data || []) as unknown as Application[],
    savedJobs: (savedJobsResult.data || []) as unknown as SavedJob[],
  };
}

const statusLabels: Record<string, { label: string; color: string }> = {
  applied: { label: 'Applied', color: 'bg-blue-100 text-blue-700' },
  viewed: { label: 'Viewed', color: 'bg-purple-100 text-purple-700' },
  screening: { label: 'Screening', color: 'bg-yellow-100 text-yellow-700' },
  interviewing: { label: 'Interviewing', color: 'bg-orange-100 text-orange-700' },
  offered: { label: 'Offered', color: 'bg-green-100 text-green-700' },
  hired: { label: 'Hired', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Not Selected', color: 'bg-gray-100 text-gray-700' },
  withdrawn: { label: 'Withdrawn', color: 'bg-gray-100 text-gray-700' },
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default async function CandidateDashboardPage() {
  const { user, candidate } = await requireCandidate();
  const { applications, savedJobs } = await getCandidateData(candidate.id);

  const profileComplete = Boolean(
    candidate.first_name &&
      candidate.last_name &&
      candidate.headline &&
      candidate.resume_url
  );

  return (
    <div className="bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {candidate.first_name || 'there'}!
            </h1>
            <p className="mt-1 text-gray-600">{user.email}</p>
          </div>
          <SignOutButton />
        </div>

        {/* Profile Completion Alert */}
        {!profileComplete && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardContent className="flex items-center justify-between pt-6">
              <div>
                <h3 className="font-medium text-yellow-800">
                  Complete your profile
                </h3>
                <p className="text-sm text-yellow-700">
                  Add your resume and headline to increase visibility to
                  employers.
                </p>
              </div>
              <Link href="/account/candidate/profile">
                <Button variant="outline" size="sm">
                  Edit Profile
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/jobs">
            <Card className="h-full transition hover:border-blue-300 hover:shadow-md">
              <CardContent className="pt-6">
                <h3 className="font-medium text-gray-900">Find Jobs</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Browse open positions
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/account/candidate/profile">
            <Card className="h-full transition hover:border-blue-300 hover:shadow-md">
              <CardContent className="pt-6">
                <h3 className="font-medium text-gray-900">Edit Profile</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Update your information
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/account/candidate/applications">
            <Card className="h-full transition hover:border-blue-300 hover:shadow-md">
              <CardContent className="pt-6">
                <h3 className="font-medium text-gray-900">Applications</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Track your applications
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/account/candidate/saved">
            <Card className="h-full transition hover:border-blue-300 hover:shadow-md">
              <CardContent className="pt-6">
                <h3 className="font-medium text-gray-900">Saved Jobs</h3>
                <p className="mt-1 text-sm text-gray-500">
                  View bookmarked jobs
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Recent Applications */}
          <Card>
            <CardContent className="pt-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Recent Applications
                </h2>
                <Link
                  href="/account/candidate/applications"
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  View all
                </Link>
              </div>

              {applications.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-gray-500">No applications yet</p>
                  <Link
                    href="/jobs"
                    className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-500"
                  >
                    Start applying
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((app) => {
                    const job = Array.isArray(app.job) ? app.job[0] : app.job;
                    const company = job?.company
                      ? Array.isArray(job.company)
                        ? job.company[0]
                        : job.company
                      : null;
                    const status = statusLabels[app.status] || {
                      label: app.status,
                      color: 'bg-gray-100 text-gray-700',
                    };

                    return (
                      <div
                        key={app.id}
                        className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0 last:pb-0"
                      >
                        <div>
                          {job ? (
                            <Link
                              href={`/jobs/${job.id}`}
                              className="font-medium text-gray-900 hover:text-blue-600"
                            >
                              {job.title}
                            </Link>
                          ) : (
                            <span className="font-medium text-gray-900">
                              Job no longer available
                            </span>
                          )}
                          {company && (
                            <p className="text-sm text-gray-500">
                              {company.name}
                            </p>
                          )}
                          <p className="text-xs text-gray-400">
                            Applied {formatDate(app.applied_at)}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.color}`}
                        >
                          {status.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Saved Jobs */}
          <Card>
            <CardContent className="pt-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Saved Jobs
                </h2>
                <Link
                  href="/account/candidate/saved"
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  View all
                </Link>
              </div>

              {savedJobs.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-gray-500">No saved jobs yet</p>
                  <Link
                    href="/jobs"
                    className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-500"
                  >
                    Browse jobs
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {savedJobs.map((saved) => {
                    const job = Array.isArray(saved.job)
                      ? saved.job[0]
                      : saved.job;
                    const company = job?.company
                      ? Array.isArray(job.company)
                        ? job.company[0]
                        : job.company
                      : null;

                    return (
                      <div
                        key={saved.id}
                        className="border-b border-gray-100 pb-4 last:border-0 last:pb-0"
                      >
                        {job ? (
                          <>
                            <Link
                              href={`/jobs/${job.id}`}
                              className="font-medium text-gray-900 hover:text-blue-600"
                            >
                              {job.title}
                            </Link>
                            {company && (
                              <p className="text-sm text-gray-500">
                                {company.name}
                              </p>
                            )}
                            <p className="text-xs text-gray-400">
                              {job.location_city && job.location_state
                                ? `${job.location_city}, ${job.location_state}`
                                : job.work_setting === 'remote'
                                  ? 'Remote'
                                  : 'Location not specified'}
                            </p>
                          </>
                        ) : (
                          <span className="text-gray-500">
                            Job no longer available
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Profile Summary */}
        <Card className="mt-8">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Profile Summary
                </h2>
                <div className="mt-4 space-y-2">
                  <p className="text-gray-600">
                    <span className="font-medium">Name:</span>{' '}
                    {candidate.first_name} {candidate.last_name}
                  </p>
                  {candidate.headline && (
                    <p className="text-gray-600">
                      <span className="font-medium">Headline:</span>{' '}
                      {candidate.headline}
                    </p>
                  )}
                  {(candidate.city || candidate.state) && (
                    <p className="text-gray-600">
                      <span className="font-medium">Location:</span>{' '}
                      {[candidate.city, candidate.state]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  )}
                  <p className="text-gray-600">
                    <span className="font-medium">Resume:</span>{' '}
                    {candidate.resume_url ? (
                      <span className="text-green-600">Uploaded</span>
                    ) : (
                      <span className="text-yellow-600">Not uploaded</span>
                    )}
                  </p>
                </div>
              </div>
              <Link href="/account/candidate/profile">
                <Button variant="outline">Edit Profile</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
