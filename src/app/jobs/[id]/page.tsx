import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/requireAuth';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

interface JobDetails {
  id: string;
  title: string;
  description: string;
  requirements: string | null;
  benefits: string | null;
  location_city: string | null;
  location_state: string | null;
  work_setting: 'onsite' | 'remote' | 'hybrid';
  job_type: 'full_time' | 'part_time' | 'contract' | 'internship' | 'temporary';
  experience_level: 'entry' | 'mid' | 'senior' | 'lead' | 'executive' | null;
  salary_min: number | null;
  salary_max: number | null;
  show_salary: boolean;
  published_at: string | null;
  company: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    website: string | null;
    description: string | null;
  } | null;
}

const jobTypeLabels: Record<JobDetails['job_type'], string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
  temporary: 'Temporary',
};

const workSettingLabels: Record<JobDetails['work_setting'], string> = {
  onsite: 'On-site',
  remote: 'Remote',
  hybrid: 'Hybrid',
};

const experienceLabels: Record<NonNullable<JobDetails['experience_level']>, string> = {
  entry: 'Entry Level',
  mid: 'Mid Level',
  senior: 'Senior Level',
  lead: 'Lead',
  executive: 'Executive',
};

function formatSalary(min: number | null, max: number | null): string | null {
  if (!min && !max) return null;
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

  if (min && max) {
    return `${formatter.format(min)} - ${formatter.format(max)} per year`;
  }
  if (min) return `From ${formatter.format(min)} per year`;
  if (max) return `Up to ${formatter.format(max)} per year`;
  return null;
}

async function getJob(id: string): Promise<JobDetails | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('jobs')
    .select(
      `
      id,
      title,
      description,
      requirements,
      benefits,
      location_city,
      location_state,
      work_setting,
      job_type,
      experience_level,
      salary_min,
      salary_max,
      show_salary,
      published_at,
      companies(id, name, slug, logo_url, website, description)
    `
    )
    .eq('id', id)
    .eq('status', 'active')
    .single();

  if (error || !data) {
    return null;
  }

  return {
    ...data,
    company: Array.isArray(data.companies) ? data.companies[0] ?? null : null,
  } as JobDetails;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = await getJob(id);

  if (!job) {
    return { title: 'Job Not Found | FSG Talent Hub' };
  }

  return {
    title: `${job.title} at ${job.company?.name || 'Company'} | FSG Talent Hub`,
    description: job.description.slice(0, 160),
  };
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [job, user] = await Promise.all([getJob(id), getUser()]);

  if (!job) {
    notFound();
  }

  const location =
    job.location_city && job.location_state
      ? `${job.location_city}, ${job.location_state}`
      : workSettingLabels[job.work_setting];

  const salary = job.show_salary
    ? formatSalary(job.salary_min, job.salary_max)
    : null;

  return (
    <div className="bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            href="/jobs"
            className="mb-4 inline-block text-sm text-blue-600 hover:text-blue-500"
          >
            &larr; Back to jobs
          </Link>

          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
              {job.company && (
                <p className="mt-2 text-lg text-gray-600">{job.company.name}</p>
              )}
            </div>
            {user ? (
              <Link href={`/jobs/${id}/apply`}>
                <Button size="lg">Apply Now</Button>
              </Link>
            ) : (
              <Link href={`/signin?next=/jobs/${id}/apply`}>
                <Button size="lg">Sign in to Apply</Button>
              </Link>
            )}
          </div>

          {/* Meta info */}
          <div className="mt-6 flex flex-wrap gap-4">
            <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
              {location}
            </span>
            <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
              {workSettingLabels[job.work_setting]}
            </span>
            <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
              {jobTypeLabels[job.job_type]}
            </span>
            {job.experience_level && (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
                {experienceLabels[job.experience_level]}
              </span>
            )}
          </div>

          {salary && (
            <p className="mt-4 text-lg font-medium text-gray-900">{salary}</p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="prose prose-gray max-w-none pt-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Job Description
                </h2>
                <div className="mt-4 whitespace-pre-wrap text-gray-600">
                  {job.description}
                </div>

                {job.requirements && (
                  <>
                    <h2 className="mt-8 text-xl font-semibold text-gray-900">
                      Requirements
                    </h2>
                    <div className="mt-4 whitespace-pre-wrap text-gray-600">
                      {job.requirements}
                    </div>
                  </>
                )}

                {job.benefits && (
                  <>
                    <h2 className="mt-8 text-xl font-semibold text-gray-900">
                      Benefits
                    </h2>
                    <div className="mt-4 whitespace-pre-wrap text-gray-600">
                      {job.benefits}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div>
            {job.company && (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-gray-900">
                    About {job.company.name}
                  </h3>
                  {job.company.description && (
                    <p className="mt-2 text-sm text-gray-600">
                      {job.company.description}
                    </p>
                  )}
                  {job.company.website && (
                    <a
                      href={job.company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-block text-sm text-blue-600 hover:text-blue-500"
                    >
                      Visit website &rarr;
                    </a>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="mt-4">
              {user ? (
                <Link href={`/jobs/${id}/apply`} className="block">
                  <Button className="w-full" size="lg">
                    Apply Now
                  </Button>
                </Link>
              ) : (
                <Link href={`/signin?next=/jobs/${id}/apply`} className="block">
                  <Button className="w-full" size="lg">
                    Sign in to Apply
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
