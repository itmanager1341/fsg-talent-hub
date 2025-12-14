import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/requireAuth';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

export const metadata = {
  title: 'Application Submitted | FSG Talent Hub',
  description: 'Your job application has been submitted successfully.',
};

async function getJob(id: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from('jobs')
    .select('id, title, companies(name)')
    .eq('id', id)
    .single();

  if (!data) return null;

  return {
    id: data.id,
    title: data.title,
    company: Array.isArray(data.companies) ? data.companies[0] : null,
  };
}

export default async function ApplySuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ existing?: string }>;
}) {
  await requireAuth();
  const { id } = await params;
  const { existing } = await searchParams;

  const job = await getJob(id);

  const isExisting = existing === 'true';

  return (
    <div className="bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-8 w-8 text-green-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          {isExisting ? 'Already Applied!' : 'Application Submitted!'}
        </h1>

        {job && (
          <p className="mb-8 text-gray-600">
            {isExisting
              ? `You've already applied for ${job.title}`
              : `Your application for ${job.title}`}
            {job.company && ` at ${job.company.name}`}
            {isExisting ? '.' : ' has been sent to the employer.'}
          </p>
        )}

        <Card className="mb-8 text-left">
          <CardContent className="pt-6">
            <h2 className="mb-4 font-semibold text-gray-900">
              What happens next?
            </h2>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-700">
                  1
                </span>
                <span>
                  The employer will review your application and profile
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-700">
                  2
                </span>
                <span>
                  If they&apos;re interested, they&apos;ll reach out via email
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-700">
                  3
                </span>
                <span>
                  Track your application status in your dashboard
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link href="/account/candidate/applications">
            <Button size="lg">View My Applications</Button>
          </Link>
          <Link href="/jobs">
            <Button variant="outline" size="lg">
              Browse More Jobs
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
