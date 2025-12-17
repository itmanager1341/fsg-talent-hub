import Link from 'next/link';
import { requireCandidate } from '@/lib/auth/requireAuth';
import { Card, CardContent } from '@/components/ui/Card';
import { ResumeBuilder } from './ResumeBuilder';
import { getResumeVersions } from './actions';

export const metadata = {
  title: 'Resume Builder | FSG Talent Hub',
  description: 'AI-powered resume analysis and optimization.',
};

export default async function ResumeBuilderPage() {
  const { candidate } = await requireCandidate();
  const { versions } = await getResumeVersions();

  return (
    <div className="bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/account/candidate"
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            &larr; Back to dashboard
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            AI Resume Builder
          </h1>
          <p className="mt-1 text-gray-600">
            Analyze and optimize your resume with AI to improve your job search
            success.
          </p>
        </div>

        {/* Saved Versions */}
        {versions.length > 0 && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Saved Versions
              </h2>
              <div className="divide-y divide-gray-100">
                {versions.map((version) => (
                  <div
                    key={version.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {version.version_name}
                        {version.is_primary && (
                          <span className="ml-2 rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                            Primary
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(version.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {version.ats_score && (
                      <span
                        className={`rounded-full px-2 py-1 text-sm font-medium ${
                          version.ats_score >= 80
                            ? 'bg-green-100 text-green-700'
                            : version.ats_score >= 60
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {version.ats_score}/100
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current ATS Score */}
        {candidate.resume_ats_score && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Current Resume Score
                  </h2>
                  <p className="text-sm text-gray-600">
                    Last analyzed:{' '}
                    {candidate.resume_analyzed_at
                      ? new Date(
                          candidate.resume_analyzed_at
                        ).toLocaleDateString()
                      : 'Never'}
                  </p>
                </div>
                <div
                  className={`rounded-full px-4 py-2 text-2xl font-bold ${
                    candidate.resume_ats_score >= 80
                      ? 'bg-green-100 text-green-700'
                      : candidate.resume_ats_score >= 60
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                  }`}
                >
                  {candidate.resume_ats_score}/100
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resume Builder */}
        <ResumeBuilder
          candidateTier={candidate.tier}
          currentResumeText={candidate.resume_text}
        />

        {/* Help Section */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              How It Works
            </h2>
            <div className="space-y-4 text-sm text-gray-600">
              <div className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                  1
                </span>
                <div>
                  <p className="font-medium text-gray-900">
                    Paste Your Resume
                  </p>
                  <p>
                    Copy and paste the text content from your current resume.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                  2
                </span>
                <div>
                  <p className="font-medium text-gray-900">Get AI Analysis</p>
                  <p>
                    Our AI analyzes your resume for ATS compatibility, content
                    quality, and keywords.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                  3
                </span>
                <div>
                  <p className="font-medium text-gray-900">
                    Optimize (Premium)
                  </p>
                  <p>
                    Let AI rewrite sections of your resume for maximum impact.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
