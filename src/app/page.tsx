import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { createClient } from '@/lib/supabase/server';

interface FeaturedJob {
  id: string;
  title: string;
  location_city: string | null;
  location_state: string | null;
  work_setting: string;
  companyName: string | null;
}

async function getFeaturedJobs(): Promise<FeaturedJob[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('jobs')
    .select(
      `
      id,
      title,
      location_city,
      location_state,
      work_setting,
      companies(name)
    `
    )
    .eq('status', 'active')
    .order('published_at', { ascending: false })
    .limit(6);

  if (!data) return [];

  return data.map((job) => ({
    id: job.id,
    title: job.title,
    location_city: job.location_city,
    location_state: job.location_state,
    work_setting: job.work_setting,
    companyName: Array.isArray(job.companies) ? job.companies[0]?.name ?? null : null,
  }));
}

export default async function Home() {
  const featuredJobs = await getFeaturedJobs();

  return (
    <div className="bg-gray-50">
      {/* Hero Section */}
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <h1 className="mb-4 text-4xl font-semibold text-gray-900">
            Find Your Next Role in Financial Services
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-600">
            Connect with top employers in mortgage servicing, M&A advisory, and
            financial services.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/jobs">
              <Button size="lg">Browse Jobs</Button>
            </Link>
            <Link href="/employers">
              <Button variant="outline" size="lg">
                Post a Job
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Search */}
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <form action="/jobs" method="GET" className="flex gap-4">
            <input
              type="text"
              name="q"
              placeholder="Job title or keyword"
              className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <select
              name="location"
              className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Locations</option>
              <option value="remote">Remote</option>
              <option value="TX">Texas</option>
              <option value="CA">California</option>
              <option value="NY">New York</option>
              <option value="FL">Florida</option>
            </select>
            <Button type="submit" size="lg">
              Search
            </Button>
          </form>
        </div>
      </section>

      {/* Featured Jobs */}
      {featuredJobs.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-900">
              Latest Jobs
            </h2>
            <Link
              href="/jobs"
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              View all jobs &rarr;
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {featuredJobs.map((job) => (
              <Link key={job.id} href={`/jobs/${job.id}`}>
                <Card className="h-full transition hover:shadow-md">
                  <CardContent className="pt-6">
                    <h3 className="mb-1 font-medium text-gray-900">
                      {job.title}
                    </h3>
                    <p className="mb-2 text-sm text-gray-600">
                      {job.companyName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {job.location_city && job.location_state
                        ? `${job.location_city}, ${job.location_state}`
                        : job.work_setting === 'remote'
                          ? 'Remote'
                          : 'Location not specified'}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Value Props */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="mb-8 text-center text-2xl font-semibold text-gray-900">
          Why FSG Talent Hub?
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <h3 className="mb-2 text-lg font-medium text-gray-900">
                For Candidates
              </h3>
              <p className="text-sm text-gray-600">
                AI-powered job matching, resume tools, and direct access to
                industry-leading employers.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <h3 className="mb-2 text-lg font-medium text-gray-900">
                For Employers
              </h3>
              <p className="text-sm text-gray-600">
                Quality applicant pipeline with AI-enhanced matching and
                streamlined hiring tools.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <h3 className="mb-2 text-lg font-medium text-gray-900">
                Industry Focus
              </h3>
              <p className="text-sm text-gray-600">
                Specialized for FSI, AM&AA, and partner associations in
                financial services.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="rounded-lg bg-blue-50 p-8">
              <h3 className="mb-2 text-xl font-semibold text-gray-900">
                Looking for your next opportunity?
              </h3>
              <p className="mb-4 text-gray-600">
                Create your profile and get matched with relevant jobs.
              </p>
              <Link href="/signin">
                <Button>Get Started</Button>
              </Link>
            </div>
            <div className="rounded-lg bg-gray-100 p-8">
              <h3 className="mb-2 text-xl font-semibold text-gray-900">
                Hiring top talent?
              </h3>
              <p className="mb-4 text-gray-600">
                Post jobs and reach qualified candidates in financial services.
              </p>
              <Link href="/employers">
                <Button variant="outline">Learn More</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
