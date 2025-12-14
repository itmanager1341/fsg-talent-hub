import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/Card';

export const metadata = {
  title: 'Company | FSG Talent Hub',
  description: 'Company profile and open roles.',
};

export default async function CompanyProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const supabase = await createClient();
  const { slug } = await params;

  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select(
      'id, name, slug, website, description, industry, headquarters_city, headquarters_state, logo_url, is_active'
    )
    .eq('slug', slug)
    .single();

  if (companyError || !company || !company.is_active) {
    return (
      <div className="bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Link
              href="/companies"
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              &larr; Back to companies
            </Link>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-gray-700">
            Company not found.
          </div>
        </div>
      </div>
    );
  }

  const { data: jobs, error: jobsError } = await supabase
    .from('jobs')
    .select('id, title, location_city, location_state, work_setting, job_type, published_at')
    .eq('company_id', company.id)
    .eq('status', 'active')
    .order('published_at', { ascending: false })
    .limit(50);

  const location =
    company.headquarters_city && company.headquarters_state
      ? `${company.headquarters_city}, ${company.headquarters_state}`
      : company.headquarters_city || company.headquarters_state || null;

  return (
    <div className="bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/companies"
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            &larr; Back to companies
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
          <div className="mt-2 text-sm text-gray-600">
            {company.industry ? <span>{company.industry}</span> : null}
            {company.industry && location ? <span> · </span> : null}
            {location ? <span>{location}</span> : null}
          </div>
          {company.website && (
            <div className="mt-3">
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Visit website
              </a>
            </div>
          )}
        </div>

        {company.description && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <h2 className="mb-2 text-lg font-semibold text-gray-900">About</h2>
              <p className="whitespace-pre-wrap text-gray-700">
                {company.description}
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="pt-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Open roles
            </h2>

            {jobsError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                Failed to load jobs: {jobsError.message}
              </div>
            )}

            <div className="space-y-3">
              {(jobs || []).map((job) => {
                const jobLocation =
                  job.location_city && job.location_state
                    ? `${job.location_city}, ${job.location_state}`
                    : job.location_city || job.location_state || null;

                return (
                  <div
                    key={job.id}
                    className="rounded-lg border border-gray-200 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-gray-900">
                          <Link href={`/jobs/${job.id}`} className="hover:underline">
                            {job.title}
                          </Link>
                        </h3>
                        <div className="mt-1 text-sm text-gray-600">
                          {jobLocation ? <span>{jobLocation}</span> : null}
                          {jobLocation && job.work_setting ? <span> · </span> : null}
                          {job.work_setting ? <span>{job.work_setting}</span> : null}
                          {(jobLocation || job.work_setting) && job.job_type ? (
                            <span> · </span>
                          ) : null}
                          {job.job_type ? <span>{job.job_type}</span> : null}
                        </div>
                      </div>
                      <Link
                        href={`/jobs/${job.id}`}
                        className="shrink-0 text-sm font-medium text-blue-600 hover:text-blue-500"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {!jobsError && (jobs?.length || 0) === 0 && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                No active roles listed yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

