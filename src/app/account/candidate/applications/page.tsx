import Link from 'next/link';
import { requireCandidate } from '@/lib/auth/requireAuth';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/Card';

export const metadata = {
  title: 'My Applications | FSG Talent Hub',
  description: 'Track your job applications.',
};

interface Application {
  id: string;
  status: string;
  applied_at: string;
  cover_letter: string | null;
  job: {
    id: string;
    title: string;
    location_city: string | null;
    location_state: string | null;
    work_setting: string;
    company: { name: string } | null;
  } | null;
}

async function getApplications(candidateId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('applications')
    .select(
      `
      id,
      status,
      applied_at,
      cover_letter,
      job:jobs(id, title, location_city, location_state, work_setting, company:companies(name))
    `
    )
    .eq('candidate_id', candidateId)
    .order('applied_at', { ascending: false });

  if (error) {
    console.error('Error fetching applications:', error);
    return [];
  }

  return (data || []) as unknown as Application[];
}

const statusLabels: Record<string, { label: string; color: string }> = {
  applied: { label: 'Applied', color: 'bg-blue-100 text-blue-700' },
  viewed: { label: 'Viewed', color: 'bg-purple-100 text-purple-700' },
  screening: { label: 'Screening', color: 'bg-yellow-100 text-yellow-700' },
  interviewing: {
    label: 'Interviewing',
    color: 'bg-orange-100 text-orange-700',
  },
  offered: { label: 'Offered', color: 'bg-green-100 text-green-700' },
  hired: { label: 'Hired', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Not Selected', color: 'bg-gray-100 text-gray-700' },
  withdrawn: { label: 'Withdrawn', color: 'bg-gray-100 text-gray-700' },
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default async function ApplicationsPage() {
  const { candidate } = await requireCandidate();
  const applications = await getApplications(candidate.id);

  return (
    <div className="bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/account/candidate"
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            &larr; Back to dashboard
          </Link>
        </div>

        <h1 className="mb-8 text-2xl font-bold text-gray-900">
          My Applications
        </h1>

        {applications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <h2 className="text-lg font-medium text-gray-900">
                No applications yet
              </h2>
              <p className="mt-2 text-gray-600">
                Start applying to jobs to see your applications here.
              </p>
              <Link
                href="/jobs"
                className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
              >
                Browse Jobs
              </Link>
            </CardContent>
          </Card>
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

              const location =
                job?.location_city && job?.location_state
                  ? `${job.location_city}, ${job.location_state}`
                  : job?.work_setting === 'remote'
                    ? 'Remote'
                    : null;

              return (
                <Card key={app.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        {job ? (
                          <Link
                            href={`/jobs/${job.id}`}
                            className="text-lg font-medium text-gray-900 hover:text-blue-600"
                          >
                            {job.title}
                          </Link>
                        ) : (
                          <span className="text-lg font-medium text-gray-500">
                            Job no longer available
                          </span>
                        )}
                        {company && (
                          <p className="text-gray-600">{company.name}</p>
                        )}
                        {location && (
                          <p className="text-sm text-gray-500">{location}</p>
                        )}
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-sm font-medium ${status.color}`}
                      >
                        {status.label}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                      <p className="text-sm text-gray-500">
                        Applied {formatDate(app.applied_at)}
                      </p>
                      {job && (
                        <Link
                          href={`/jobs/${job.id}`}
                          className="text-sm text-blue-600 hover:text-blue-500"
                        >
                          View Job
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
