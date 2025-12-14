import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireEmployer } from '@/lib/auth/requireAuth';
import { createClient } from '@/lib/supabase/server';
import { JobForm } from '../../_components/JobForm';
import { JobStatusControls } from './JobStatusControls';
import { Card, CardContent } from '@/components/ui/Card';

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
    title: `Edit ${job.title} | FSG Talent Hub`,
    description: 'Edit your job posting.',
  };
}

async function getJob(id: string, companyId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .eq('company_id', companyId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

export default async function EditJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { companyUser } = await requireEmployer();
  const company = Array.isArray(companyUser.company)
    ? companyUser.company[0]
    : companyUser.company;

  const job = await getJob(id, company.id);

  if (!job) {
    notFound();
  }

  return (
    <div className="bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
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
            <h1 className="text-2xl font-bold text-gray-900">Edit Job</h1>
            <p className="mt-1 text-gray-600">{job.title}</p>
          </div>
          {job.apply_count > 0 && (
            <Link
              href={`/employers/jobs/${id}/applications`}
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              View {job.apply_count} Application
              {job.apply_count !== 1 ? 's' : ''}
            </Link>
          )}
        </div>

        {/* Status Controls */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <h2 className="mb-4 font-semibold text-gray-900">Job Status</h2>
            <JobStatusControls jobId={job.id} currentStatus={job.status} />
            <div className="mt-4 flex gap-4 text-sm text-gray-500">
              <span>{job.view_count} views</span>
              <span>{job.apply_count} applications</span>
              {job.published_at && (
                <span>
                  Published{' '}
                  {new Date(job.published_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <JobForm companyId={company.id} companyName={company.name} job={job} />
      </div>
    </div>
  );
}
