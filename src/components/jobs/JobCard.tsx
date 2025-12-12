import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';

export interface JobCardProps {
  id: string;
  title: string;
  companyName: string | null;
  location: string | null;
  workSetting: 'onsite' | 'remote' | 'hybrid';
  jobType: 'full_time' | 'part_time' | 'contract' | 'internship' | 'temporary';
  salaryMin?: number | null;
  salaryMax?: number | null;
  showSalary?: boolean;
  postedAt?: string | null;
}

const jobTypeLabels: Record<JobCardProps['jobType'], string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
  temporary: 'Temporary',
};

const workSettingLabels: Record<JobCardProps['workSetting'], string> = {
  onsite: 'On-site',
  remote: 'Remote',
  hybrid: 'Hybrid',
};

function formatSalary(min?: number | null, max?: number | null): string | null {
  if (!min && !max) return null;
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

  if (min && max) {
    return `${formatter.format(min)} - ${formatter.format(max)}`;
  }
  if (min) return `From ${formatter.format(min)}`;
  if (max) return `Up to ${formatter.format(max)}`;
  return null;
}

function formatPostedDate(dateString?: string | null): string | null {
  if (!dateString) return null;
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

export function JobCard({
  id,
  title,
  companyName,
  location,
  workSetting,
  jobType,
  salaryMin,
  salaryMax,
  showSalary,
  postedAt,
}: JobCardProps) {
  const salary = showSalary ? formatSalary(salaryMin, salaryMax) : null;
  const posted = formatPostedDate(postedAt);

  return (
    <Link href={`/jobs/${id}`}>
      <Card className="h-full transition hover:border-blue-300 hover:shadow-md">
        <CardContent className="pt-6">
          <h3 className="mb-1 text-lg font-medium text-gray-900">{title}</h3>
          {companyName && (
            <p className="mb-2 text-sm font-medium text-gray-700">
              {companyName}
            </p>
          )}

          <div className="mb-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
              {workSettingLabels[workSetting]}
            </span>
            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
              {jobTypeLabels[jobType]}
            </span>
          </div>

          <p className="text-sm text-gray-500">
            {location || workSettingLabels[workSetting]}
          </p>

          {salary && (
            <p className="mt-2 text-sm font-medium text-gray-900">{salary}</p>
          )}

          {posted && (
            <p className="mt-2 text-xs text-gray-400">Posted {posted}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
