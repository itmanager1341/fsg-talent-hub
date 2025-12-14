import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireEmployerOrAdmin } from '@/lib/auth/requireAuth';
import { Card, CardContent } from '@/components/ui/Card';
import { ResumeViewButton } from '@/components/candidates/ResumeViewButton';

export const metadata = {
  title: 'Candidate | FSG Talent Hub',
  description: 'Candidate profile (employers only).',
};

export default async function CandidateProfileViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireEmployerOrAdmin();
  const supabase = await createClient();
  const { id } = await params;

  const { data: candidate, error } = await supabase
    .from('candidates')
    .select(
      'id, first_name, last_name, email, phone, headline, summary, city, state, resume_url, resume_filename, is_searchable, is_active'
    )
    .eq('id', id)
    .single();

  if (error || !candidate || !candidate.is_active) {
    return (
      <div className="bg-gray-50">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Link
              href="/candidates"
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              &larr; Back to candidates
            </Link>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-gray-700">
            Candidate not found.
          </div>
        </div>
      </div>
    );
  }

  const name =
    candidate.first_name || candidate.last_name
      ? `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim()
      : 'Candidate';
  const location =
    candidate.city && candidate.state
      ? `${candidate.city}, ${candidate.state}`
      : candidate.city || candidate.state || null;

  return (
    <div className="bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/candidates"
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            &larr; Back to candidates
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
          <div className="mt-2 text-sm text-gray-600">
            {candidate.headline ? <span>{candidate.headline}</span> : null}
            {candidate.headline && location ? <span> · </span> : null}
            {location ? <span>{location}</span> : null}
          </div>
          <div className="mt-3 text-sm text-gray-600">
            {candidate.email ? <div>{candidate.email}</div> : null}
            {candidate.phone ? <div>{candidate.phone}</div> : null}
          </div>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">Resume</h2>
            {candidate.resume_url ? (
              <ResumeViewButton candidateId={candidate.id} />
            ) : (
              <div className="text-sm text-gray-600">No resume on file.</div>
            )}
            {candidate.resume_filename && (
              <div className="mt-2 text-xs text-gray-500">
                File: {candidate.resume_filename}
              </div>
            )}
          </CardContent>
        </Card>

        {candidate.summary && (
          <Card>
            <CardContent className="pt-6">
              <h2 className="mb-3 text-lg font-semibold text-gray-900">
                Summary
              </h2>
              <p className="whitespace-pre-wrap text-gray-700">
                {candidate.summary}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

