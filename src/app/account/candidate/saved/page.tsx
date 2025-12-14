import Link from 'next/link';
import { requireCandidate } from '@/lib/auth/requireAuth';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { RemoveSavedJobButton } from './RemoveSavedJobButton';

export const metadata = {
  title: 'Saved Jobs | FSG Talent Hub',
  description: 'View your saved jobs.',
};

interface SavedJob {
  id: string;
  created_at: string;
  job: {
    id: string;
    title: string;
    location_city: string | null;
    location_state: string | null;
    work_setting: string;
    job_type: string;
    company: { name: string } | null;
  } | null;
}

async function getSavedJobs(candidateId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('saved_jobs')
    .select(
      `
      id,
      created_at,
      job:jobs(id, title, location_city, location_state, work_setting, job_type, company:companies(name))
    `
    )
    .eq('candidate_id', candidateId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching saved jobs:', error);
    return [];
  }

  return (data || []) as unknown as SavedJob[];
}

const jobTypeLabels: Record<string, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
  temporary: 'Temporary',
};

const workSettingLabels: Record<string, string> = {
  onsite: 'On-site',
  remote: 'Remote',
  hybrid: 'Hybrid',
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default async function SavedJobsPage() {
  const { candidate } = await requireCandidate();
  const savedJobs = await getSavedJobs(candidate.id);

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

        <h1 className="mb-8 text-2xl font-bold text-gray-900">Saved Jobs</h1>

        {savedJobs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <h2 className="text-lg font-medium text-gray-900">
                No saved jobs yet
              </h2>
              <p className="mt-2 text-gray-600">
                Save jobs you&apos;re interested in to review them later.
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
            {savedJobs.map((saved) => {
              const job = Array.isArray(saved.job) ? saved.job[0] : saved.job;
              const company = job?.company
                ? Array.isArray(job.company)
                  ? job.company[0]
                  : job.company
                : null;

              const location =
                job?.location_city && job?.location_state
                  ? `${job.location_city}, ${job.location_state}`
                  : job?.work_setting === 'remote'
                    ? 'Remote'
                    : null;

              return (
                <Card key={saved.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        {job ? (
                          <>
                            <Link
                              href={`/jobs/${job.id}`}
                              className="text-lg font-medium text-gray-900 hover:text-blue-600"
                            >
                              {job.title}
                            </Link>
                            {company && (
                              <p className="text-gray-600">{company.name}</p>
                            )}
                            <div className="mt-2 flex flex-wrap gap-2">
                              {location && (
                                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                                  {location}
                                </span>
                              )}
                              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                                {workSettingLabels[job.work_setting] ||
                                  job.work_setting}
                              </span>
                              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                                {jobTypeLabels[job.job_type] || job.job_type}
                              </span>
                            </div>
                          </>
                        ) : (
                          <span className="text-gray-500">
                            Job no longer available
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {job && (
                          <Link href={`/jobs/${job.id}/apply`}>
                            <Button size="sm">Apply</Button>
                          </Link>
                        )}
                        <RemoveSavedJobButton
                          savedJobId={saved.id}
                          candidateId={candidate.id}
                        />
                      </div>
                    </div>

                    <p className="mt-4 text-sm text-gray-500">
                      Saved {formatDate(saved.created_at)}
                    </p>
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
