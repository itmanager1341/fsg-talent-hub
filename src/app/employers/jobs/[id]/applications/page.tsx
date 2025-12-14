import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireEmployer } from '@/lib/auth/requireAuth';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/Card';
import { ApplicationCard } from './ApplicationCard';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: job } = await supabase
    .from('jobs')
    .select('title')
    .eq('id', id)
    .single();

  if (!job) {
    return { title: 'Job Not Found | FSG Talent Hub' };
  }

  return {
    title: `Applications for ${job.title} | FSG Talent Hub`,
    description: 'Review applications for your job posting.',
  };
}

interface Application {
  id: string;
  status: string;
  cover_letter: string | null;
  resume_url: string | null;
  applied_at: string;
  /**
   * Joined candidate record. This can be `null` if RLS prevents employers from
   * reading rows in `public.candidates` (even though the application exists).
   *
   * The UI should remain functional (show the application + allow status
   * updates) even if candidate details are hidden.
   */
  candidate:
    | {
        id: string;
        first_name: string | null;
        last_name: string | null;
        email: string;
        phone: string | null;
        headline: string | null;
        city: string | null;
        state: string | null;
        resume_url: string | null;
      }
    | { id: string }[]
    | null;
}

async function getJobWithApplications(id: string, companyId: string) {
  const supabase = await createClient();

  // Get job
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('id, title, status, apply_count')
    .eq('id', id)
    .eq('company_id', companyId)
    .single();

  if (jobError || !job) {
    return null;
  }

  // Get applications with candidate info
  const { data: applications, error: appError } = await supabase
    .from('applications')
    .select(
      `
      id,
      status,
      cover_letter,
      resume_url,
      applied_at,
      candidate:candidates(
        id,
        first_name,
        last_name,
        email,
        phone,
        headline,
        city,
        state,
        resume_url
      )
    `
    )
    .eq('job_id', id)
    .order('applied_at', { ascending: false });

  if (appError) {
    console.error('Error fetching applications:', appError);
    return { job, applications: [] };
  }

  return {
    job,
    applications: (applications || []) as unknown as Application[],
  };
}

const statusTabs = [
  { value: 'all', label: 'All' },
  { value: 'applied', label: 'New' },
  { value: 'screening', label: 'Screening' },
  { value: 'interviewing', label: 'Interviewing' },
  { value: 'offered', label: 'Offered' },
  { value: 'rejected', label: 'Rejected' },
];

export default async function ApplicationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { id } = await params;
  const { status: filterStatus } = await searchParams;
  const { companyUser } = await requireEmployer();
  const company = Array.isArray(companyUser.company)
    ? companyUser.company[0]
    : companyUser.company;

  const data = await getJobWithApplications(id, company.id);

  if (!data) {
    notFound();
  }

  const { job, applications } = data;

  // Filter applications
  const filteredApplications =
    filterStatus && filterStatus !== 'all'
      ? applications.filter((app) => app.status === filterStatus)
      : applications;

  // Count by status
  const statusCounts = applications.reduce(
    (acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/employers/dashboard"
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            &larr; Back to dashboard
          </Link>
        </div>

        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
            <p className="mt-1 text-gray-600">{job.title}</p>
          </div>
          <Link
            href={`/employers/jobs/${id}/edit`}
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            Edit Job
          </Link>
        </div>

        {/* Status Tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          {statusTabs.map((tab) => {
            const count =
              tab.value === 'all'
                ? applications.length
                : statusCounts[tab.value] || 0;
            const isActive =
              filterStatus === tab.value ||
              (!filterStatus && tab.value === 'all');

            return (
              <Link
                key={tab.value}
                href={
                  tab.value === 'all'
                    ? `/employers/jobs/${id}/applications`
                    : `/employers/jobs/${id}/applications?status=${tab.value}`
                }
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label} ({count})
              </Link>
            );
          })}
        </div>

        {/* Applications List */}
        {filteredApplications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <h2 className="text-lg font-medium text-gray-900">
                No applications yet
              </h2>
              <p className="mt-2 text-gray-600">
                {filterStatus && filterStatus !== 'all'
                  ? `No applications with "${filterStatus}" status.`
                  : 'Applications will appear here when candidates apply.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((application) => {
              const candidate = Array.isArray(application.candidate)
                ? application.candidate[0]
                : application.candidate;

              return (
                <ApplicationCard
                  key={application.id}
                  application={{
                    ...application,
                    candidate,
                  }}
                  jobId={id}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
