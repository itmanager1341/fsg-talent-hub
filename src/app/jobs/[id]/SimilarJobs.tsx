import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { getSimilarJobs } from './actions';

interface SimilarJobsProps {
  jobId: string;
}

export async function SimilarJobs({ jobId }: SimilarJobsProps) {
  const similarJobs = await getSimilarJobs(jobId);

  if (similarJobs.length === 0) {
    return null;
  }

  return (
    <Card className="mt-8">
      <CardContent className="pt-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Similar Jobs
        </h2>
        <div className="space-y-4">
          {similarJobs.map((job) => (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className="block rounded-lg border border-gray-100 p-4 transition hover:border-blue-200 hover:bg-blue-50"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{job.title}</h3>
                  {job.company_name && (
                    <p className="text-sm text-gray-500">{job.company_name}</p>
                  )}
                </div>
                <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                  {job.similarity}% match
                </span>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
