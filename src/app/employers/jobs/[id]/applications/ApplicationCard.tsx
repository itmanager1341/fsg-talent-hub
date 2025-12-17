'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MatchScoreBadge } from '@/components/employer/MatchScoreBadge';
import { MatchExplanation } from '@/components/employer/MatchExplanation';
import { updateApplicationStatus, rankApplicant, type RankingResult } from './actions';

interface Candidate {
  id: string;
  /**
   * Candidate fields may be missing if the joined record is partially visible
   * (e.g. due to RLS returning only `id`). The UI should degrade gracefully.
   */
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  headline?: string | null;
  city?: string | null;
  state?: string | null;
  resume_url?: string | null;
}

interface Application {
  id: string;
  status: string;
  cover_letter: string | null;
  resume_url: string | null;
  applied_at: string;
  ai_match_score: number | null;
  ai_match_reasons: RankingResult | null;
  /**
   * Candidate can be null if employer lacks RLS permission to read `candidates`
   * (e.g. policies not yet configured). We still want the page to render and
   * allow status updates on the application.
   */
  candidate: Candidate | null;
}

interface ApplicationCardProps {
  application: Application;
  jobId: string;
  canUseAIRanking?: boolean;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  applied: { label: 'New', color: 'bg-blue-100 text-blue-700' },
  viewed: { label: 'Viewed', color: 'bg-purple-100 text-purple-700' },
  screening: { label: 'Screening', color: 'bg-yellow-100 text-yellow-700' },
  interviewing: { label: 'Interviewing', color: 'bg-orange-100 text-orange-700' },
  offered: { label: 'Offered', color: 'bg-green-100 text-green-700' },
  hired: { label: 'Hired', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejected', color: 'bg-gray-100 text-gray-700' },
  withdrawn: { label: 'Withdrawn', color: 'bg-gray-100 text-gray-500' },
};

const statusOptions = [
  { value: 'applied', label: 'New' },
  { value: 'screening', label: 'Screening' },
  { value: 'interviewing', label: 'Interviewing' },
  { value: 'offered', label: 'Offered' },
  { value: 'hired', label: 'Hired' },
  { value: 'rejected', label: 'Rejected' },
];

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function ApplicationCard({ application, jobId, canUseAIRanking = false }: ApplicationCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpeningResume, setIsOpeningResume] = useState(false);
  const [isRanking, setIsRanking] = useState(false);
  const [matchData, setMatchData] = useState<RankingResult | null>(
    application.ai_match_reasons
  );

  const { candidate } = application;
  const config = statusConfig[application.status] || statusConfig.applied;

  const handleStatusChange = (newStatus: string) => {
    setError(null);
    startTransition(async () => {
      const result = await updateApplicationStatus(application.id, newStatus);
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  };

  const handleRank = async () => {
    setError(null);
    setIsRanking(true);
    try {
      const result = await rankApplicant(application.id);
      if (result.error) {
        setError(result.error);
      } else if (result.result) {
        setMatchData(result.result);
        router.refresh();
      }
    } catch {
      setError('Failed to rank applicant');
    } finally {
      setIsRanking(false);
    }
  };

  const location =
    candidate?.city && candidate?.state
      ? `${candidate.city}, ${candidate.state}`
      : candidate?.city || candidate?.state || null;

  const resumeUrl = application.resume_url || candidate?.resume_url || null;
  const candidateName =
    candidate?.first_name || candidate?.last_name
      ? `${candidate?.first_name || ''} ${candidate?.last_name || ''}`.trim()
      : 'Candidate';

  const openCandidateResume = async () => {
    if (!candidate?.id) return;
    try {
      setIsOpeningResume(true);
      const res = await fetch(`/api/resumes/${candidate.id}`);
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error || 'Failed to open resume');
      }
      const body = (await res.json()) as { url?: string };
      if (!body.url) throw new Error('No resume URL returned');
      window.open(body.url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to open resume');
    } finally {
      setIsOpeningResume(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-gray-900">
                {candidateName}
              </h3>
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${config.color}`}
              >
                {config.label}
              </span>
              {(application.ai_match_score !== null || matchData) && (
                <MatchScoreBadge
                  score={matchData?.score ?? application.ai_match_score}
                  size="sm"
                />
              )}
            </div>

            {candidate?.headline && (
              <p className="mt-1 text-sm text-gray-600">{candidate.headline}</p>
            )}

            <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
              {candidate?.email ? (
                <a
                  href={`mailto:${candidate.email}`}
                  className="hover:text-blue-600"
                >
                  {candidate.email}
                </a>
              ) : (
                <span className="text-gray-400">
                  Candidate details unavailable
                </span>
              )}
              {candidate?.phone && <span>{candidate.phone}</span>}
              {location && <span>{location}</span>}
            </div>

            <p className="mt-2 text-xs text-gray-400">
              Applied {formatDate(application.applied_at)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {candidate?.resume_url && (
              <Button
                size="sm"
                variant="outline"
                onClick={openCandidateResume}
                disabled={isOpeningResume}
              >
                {isOpeningResume ? 'Opening...' : 'View Resume'}
              </Button>
            )}
            {!candidate?.resume_url &&
              resumeUrl &&
              (resumeUrl.startsWith('http://') || resumeUrl.startsWith('https://')) && (
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  View Resume
                </a>
              )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'Less' : 'More'}
            </Button>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            {/* AI Match Analysis */}
            <div className="mb-4">
              <MatchExplanation
                matchData={matchData}
                onRank={handleRank}
                isRanking={isRanking}
                canRank={canUseAIRanking}
              />
            </div>

            {/* Cover Letter */}
            {application.cover_letter && (
              <div className="mb-4">
                <h4 className="mb-2 text-sm font-medium text-gray-900">
                  Cover Letter
                </h4>
                <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
                  <p className="whitespace-pre-wrap">
                    {application.cover_letter}
                  </p>
                </div>
              </div>
            )}

            {/* Status Update */}
            <div>
              <h4 className="mb-2 text-sm font-medium text-gray-900">
                Update Status
              </h4>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleStatusChange(option.value)}
                    disabled={
                      isPending || application.status === option.value
                    }
                    className={`rounded-full border px-3 py-1 text-sm font-medium transition ${
                      application.status === option.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
