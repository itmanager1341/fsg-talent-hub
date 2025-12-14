import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireCandidate } from '@/lib/auth/requireAuth';
import { Card, CardContent } from '@/components/ui/Card';
import { ApplyForm } from './ApplyForm';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: job } = await supabase
    .from('jobs')
    .select('title, companies(name)')
    .eq('id', id)
    .eq('status', 'active')
    .single();

  if (!job) {
    return { title: 'Job Not Found | FSG Talent Hub' };
  }

  const company = Array.isArray(job.companies) ? job.companies[0] : null;

  return {
    title: `Apply for ${job.title} at ${company?.name || 'Company'} | FSG Talent Hub`,
    description: `Submit your application for the ${job.title} position.`,
  };
}

async function getJobForApplication(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('jobs')
    .select(
      `
      id,
      title,
      companies(id, name)
    `
    )
    .eq('id', id)
    .eq('status', 'active')
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    title: data.title,
    company: Array.isArray(data.companies) ? data.companies[0] : null,
  };
}

async function checkExistingApplication(candidateId: string, jobId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from('applications')
    .select('id, status, applied_at')
    .eq('candidate_id', candidateId)
    .eq('job_id', jobId)
    .single();

  return data;
}

export default async function ApplyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { candidate } = await requireCandidate();

  const job = await getJobForApplication(id);

  if (!job) {
    notFound();
  }

  // Check if already applied
  const existingApplication = await checkExistingApplication(candidate.id, id);

  if (existingApplication) {
    redirect(`/jobs/${id}/apply/success?existing=true`);
  }

  // Check if profile is complete enough to apply
  const profileIncomplete = !candidate.first_name || !candidate.last_name;

  return (
    <div className="bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href={`/jobs/${id}`}
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            &larr; Back to job
          </Link>
        </div>

        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          Apply for {job.title}
        </h1>
        {job.company && (
          <p className="mb-8 text-gray-600">at {job.company.name}</p>
        )}

        {profileIncomplete ? (
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Complete Your Profile First
              </h2>
              <p className="mt-2 text-gray-600">
                Please complete your profile before applying to jobs. We need at
                least your name to submit your application.
              </p>
              <div className="mt-4">
                <Link
                  href={`/account/candidate/profile?next=/jobs/${id}/apply`}
                  className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
                >
                  Complete Profile
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Profile Summary */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-semibold text-gray-900">
                      Applying as:
                    </h2>
                    <p className="mt-1 text-gray-600">
                      {candidate.first_name} {candidate.last_name}
                    </p>
                    {candidate.headline && (
                      <p className="text-sm text-gray-500">
                        {candidate.headline}
                      </p>
                    )}
                  </div>
                  <Link
                    href="/account/candidate/profile"
                    className="text-sm text-blue-600 hover:text-blue-500"
                  >
                    Edit Profile
                  </Link>
                </div>

                {candidate.resume_url ? (
                  <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 p-3">
                    <svg
                      className="h-5 w-5 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm text-green-700">
                      Resume attached: {candidate.resume_filename || 'Resume'}
                    </span>
                  </div>
                ) : (
                  <div className="mt-4 rounded-lg bg-yellow-50 p-3">
                    <p className="text-sm text-yellow-700">
                      No resume attached.{' '}
                      <Link
                        href="/account/candidate/profile"
                        className="font-medium underline"
                      >
                        Upload one
                      </Link>{' '}
                      to increase your chances.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Application Form */}
            <ApplyForm
              jobId={id}
              candidateId={candidate.id}
              resumeUrl={candidate.resume_url}
            />
          </>
        )}
      </div>
    </div>
  );
}
