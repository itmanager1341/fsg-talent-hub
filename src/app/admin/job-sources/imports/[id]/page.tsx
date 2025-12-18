import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/requireAuth';
import { notFound } from 'next/navigation';

export const metadata = {
  title: 'Job Import Details | Admin | FSG Talent Hub',
};

export default async function ImportDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  // Fetch the external job
  const { data: externalJob, error } = await supabase
    .from('external_jobs')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !externalJob) {
    notFound();
  }

  // Fetch source info
  const { data: source } = await supabase
    .from('job_sources')
    .select('name, source_type')
    .eq('id', externalJob.source_id)
    .single();

  // Fetch company if matched
  let companyName = null;
  if (externalJob.matched_company_id) {
    const { data: company } = await supabase
      .from('companies')
      .select('name')
      .eq('id', externalJob.matched_company_id)
      .single();
    companyName = company?.name || null;
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin/job-sources/imports">
          <Button variant="outline" size="sm" className="mb-4">
            ← Back to Import Queue
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Job Import Details</h1>
        <p className="mt-1 text-gray-600">Review external job details before importing</p>
      </div>

      <div className="max-w-4xl space-y-6">
        {/* Job Details Card */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="mb-4 font-semibold text-gray-900">Job Information</h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Title</dt>
                <dd className="mt-1 text-sm text-gray-900">{externalJob.title}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Company</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {companyName || externalJob.company_name || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Location</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {externalJob.location_city && externalJob.location_state
                    ? `${externalJob.location_city}, ${externalJob.location_state}`
                    : externalJob.location_city || externalJob.location_state || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Source</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {source?.name || 'Unknown'} ({source?.source_type || 'unknown'})
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      externalJob.status === 'matched'
                        ? 'bg-green-100 text-green-700'
                        : externalJob.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : externalJob.status === 'rejected'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {externalJob.status}
                  </span>
                </dd>
              </div>
              {externalJob.match_confidence && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Match Confidence</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {Math.round(externalJob.match_confidence * 100)}%
                  </dd>
                </div>
              )}
              {externalJob.salary_min && externalJob.salary_max && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Salary Range</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    ${externalJob.salary_min.toLocaleString()} - ${externalJob.salary_max.toLocaleString()}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500">Source URL</dt>
                <dd className="mt-1">
                  <a
                    href={externalJob.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {externalJob.source_url}
                  </a>
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Description Card */}
        {externalJob.description && (
          <Card>
            <CardContent className="pt-6">
              <h2 className="mb-4 font-semibold text-gray-900">Description</h2>
              <div
                className="prose prose-sm max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: externalJob.description }}
              />
            </CardContent>
          </Card>
        )}

        {/* Raw Data Card (for debugging) */}
        {externalJob.raw_data && (
          <Card>
            <CardContent className="pt-6">
              <h2 className="mb-4 font-semibold text-gray-900">Raw Data</h2>
              <pre className="max-h-96 overflow-auto rounded bg-gray-50 p-4 text-xs">
                {JSON.stringify(externalJob.raw_data, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

