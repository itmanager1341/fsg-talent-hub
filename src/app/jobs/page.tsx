import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { JobCard, type JobCardProps } from '@/components/jobs/JobCard';
import { JobFilters } from '@/components/jobs/JobFilters';

export const metadata = {
  title: 'Find Jobs | FSG Talent Hub',
  description:
    'Browse job opportunities in mortgage servicing, M&A advisory, and financial services.',
};

interface SearchParams {
  q?: string;
  location?: string;
  work_setting?: string;
  job_type?: string;
  experience?: string;
  page?: string;
}

async function getJobs(searchParams: SearchParams) {
  const supabase = await createClient();

  let query = supabase
    .from('jobs')
    .select(
      `
      id,
      title,
      location_city,
      location_state,
      work_setting,
      job_type,
      experience_level,
      salary_min,
      salary_max,
      show_salary,
      published_at,
      companies(name)
    `
    )
    .eq('status', 'active')
    .order('published_at', { ascending: false });

  // Apply filters
  if (searchParams.q) {
    query = query.ilike('title', `%${searchParams.q}%`);
  }

  if (searchParams.location) {
    if (searchParams.location === 'remote') {
      query = query.eq('work_setting', 'remote');
    } else {
      query = query.eq('location_state', searchParams.location);
    }
  }

  if (searchParams.work_setting) {
    query = query.eq('work_setting', searchParams.work_setting);
  }

  if (searchParams.job_type) {
    query = query.eq('job_type', searchParams.job_type);
  }

  if (searchParams.experience) {
    query = query.eq('experience_level', searchParams.experience);
  }

  // Pagination
  const page = parseInt(searchParams.page || '1', 10);
  const perPage = 12;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching jobs:', error);
    return { jobs: [], totalCount: 0 };
  }

  const jobs: JobCardProps[] = (data || []).map((job) => ({
    id: job.id,
    title: job.title,
    companyName: Array.isArray(job.companies)
      ? job.companies[0]?.name ?? null
      : null,
    location:
      job.location_city && job.location_state
        ? `${job.location_city}, ${job.location_state}`
        : null,
    workSetting: job.work_setting as JobCardProps['workSetting'],
    jobType: job.job_type as JobCardProps['jobType'],
    salaryMin: job.salary_min,
    salaryMax: job.salary_max,
    showSalary: job.show_salary,
    postedAt: job.published_at,
  }));

  return { jobs, totalCount: count || jobs.length };
}

function JobListSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-48 animate-pulse rounded-lg border border-gray-200 bg-gray-50"
        />
      ))}
    </div>
  );
}

async function JobList({ searchParams }: { searchParams: SearchParams }) {
  const { jobs, totalCount } = await getJobs(searchParams);

  if (jobs.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white py-12 text-center">
        <h3 className="text-lg font-medium text-gray-900">No jobs found</h3>
        <p className="mt-2 text-gray-600">
          Try adjusting your filters or search terms.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-4 text-sm text-gray-600">
        {totalCount} job{totalCount !== 1 ? 's' : ''} found
      </p>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {jobs.map((job) => (
          <JobCard key={job.id} {...job} />
        ))}
      </div>
    </div>
  );
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  return (
    <div className="bg-gray-50">
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="mb-6 text-3xl font-bold text-gray-900">Find Jobs</h1>
          <Suspense fallback={<div className="h-32 animate-pulse bg-gray-100" />}>
            <JobFilters />
          </Suspense>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Suspense fallback={<JobListSkeleton />}>
          <JobList searchParams={params} />
        </Suspense>
      </div>
    </div>
  );
}
