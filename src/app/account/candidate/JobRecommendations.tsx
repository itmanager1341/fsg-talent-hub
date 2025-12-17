import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/Card';

interface RecommendedJob {
  id: string;
  title: string;
  company_name: string | null;
  location: string;
  similarity: number;
}

async function getJobRecommendations(
  candidateId: string
): Promise<RecommendedJob[]> {
  try {
    const supabase = await createClient();

    // First check if the candidate has an embedding
    const { data: candidate } = await supabase
      .from('candidates')
      .select('embedding')
      .eq('id', candidateId)
      .single();

    if (!candidate?.embedding) {
      return [];
    }

    // Use the database function to get recommendations
    const { data, error } = await supabase.rpc('get_job_recommendations', {
      target_candidate_id: candidateId,
      match_count: 5,
    });

    if (error) {
      console.error('Error fetching recommendations:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Get additional job details
    const jobIds = data.map((j: { id: string }) => j.id);
    const { data: jobDetails } = await supabase
      .from('jobs')
      .select(
        'id, location_city, location_state, work_setting, company:companies(name)'
      )
      .in('id', jobIds);

    const detailsMap = new Map<
      string,
      { company_name: string | null; location: string }
    >();
    (jobDetails || []).forEach((j) => {
      const company = Array.isArray(j.company) ? j.company[0] : j.company;
      const location =
        j.location_city && j.location_state
          ? `${j.location_city}, ${j.location_state}`
          : j.work_setting === 'remote'
            ? 'Remote'
            : 'Location not specified';
      detailsMap.set(j.id, {
        company_name: company?.name || null,
        location,
      });
    });

    return data.map((job: { id: string; title: string; similarity: number }) => ({
      id: job.id,
      title: job.title,
      company_name: detailsMap.get(job.id)?.company_name || null,
      location: detailsMap.get(job.id)?.location || '',
      similarity: Math.round(job.similarity * 100),
    }));
  } catch (error) {
    console.error('Error in getJobRecommendations:', error);
    return [];
  }
}

interface JobRecommendationsProps {
  candidateId: string;
}

export async function JobRecommendations({
  candidateId,
}: JobRecommendationsProps) {
  const recommendations = await getJobRecommendations(candidateId);

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Recommended for You
          </h2>
          <Link
            href="/jobs"
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            Browse all
          </Link>
        </div>

        <div className="space-y-4">
          {recommendations.map((job) => (
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
                  <p className="text-xs text-gray-400">{job.location}</p>
                </div>
                <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                  {job.similarity}% match
                </span>
              </div>
            </Link>
          ))}
        </div>

        <p className="mt-4 text-xs text-gray-500">
          Based on your profile and resume
        </p>
      </CardContent>
    </Card>
  );
}
