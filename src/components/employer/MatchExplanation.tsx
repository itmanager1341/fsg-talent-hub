'use client';

import { useState } from 'react';
import { MatchScoreCircle } from './MatchScoreBadge';

interface MatchReason {
  category: string;
  assessment: 'strong_match' | 'partial_match' | 'weak_match' | 'no_match';
  details: string;
}

interface MatchData {
  score: number;
  reasons: MatchReason[];
  summary: string;
}

interface MatchExplanationProps {
  matchData: MatchData | null;
  onRank?: () => void;
  isRanking?: boolean;
  canRank?: boolean;
}

const assessmentConfig: Record<
  string,
  { label: string; color: string; bgColor: string }
> = {
  strong_match: {
    label: 'Strong',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
  },
  partial_match: {
    label: 'Partial',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
  },
  weak_match: {
    label: 'Weak',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
  },
  no_match: {
    label: 'No Match',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
  },
};

const categoryLabels: Record<string, string> = {
  skills: 'Skills',
  experience: 'Experience',
  education: 'Education',
  location: 'Location',
  overall_fit: 'Overall Fit',
};

export function MatchExplanation({
  matchData,
  onRank,
  isRanking,
  canRank,
}: MatchExplanationProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!matchData) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">AI Match Score</p>
            <p className="text-xs text-gray-500 mt-1">
              Not yet analyzed by AI
            </p>
          </div>
          {canRank && onRank && (
            <button
              onClick={onRank}
              disabled={isRanking}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isRanking ? 'Analyzing...' : 'Analyze Match'}
            </button>
          )}
          {!canRank && (
            <span className="text-xs text-gray-500">
              Upgrade to Professional for AI ranking
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-4 hover:bg-gray-50"
      >
        <div className="flex items-center gap-4">
          <MatchScoreCircle score={matchData.score} size={48} />
          <div className="text-left">
            <p className="text-sm font-medium text-gray-900">AI Match Score</p>
            <p className="text-xs text-gray-500 mt-0.5 max-w-xs truncate">
              {matchData.summary}
            </p>
          </div>
        </div>
        <svg
          className={`h-5 w-5 text-gray-400 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-gray-200 px-4 py-3 space-y-3">
          {matchData.reasons.map((reason, index) => {
            const config = assessmentConfig[reason.assessment] || assessmentConfig.weak_match;
            const label = categoryLabels[reason.category] || reason.category;

            return (
              <div key={index} className="flex gap-3">
                <div className="shrink-0 w-24">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {label}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${config.bgColor} ${config.color}`}
                    >
                      {config.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{reason.details}</p>
                </div>
              </div>
            );
          })}

          {/* Re-rank button */}
          {canRank && onRank && (
            <div className="pt-2 border-t border-gray-100">
              <button
                onClick={onRank}
                disabled={isRanking}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
              >
                {isRanking ? 'Re-analyzing...' : 'Re-analyze'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Compact inline version for list views
export function MatchScoreInline({
  score,
  summary,
  onClick,
}: {
  score: number | null;
  summary?: string;
  onClick?: () => void;
}) {
  if (score === null) {
    return null;
  }

  const color =
    score >= 80
      ? 'text-green-600'
      : score >= 60
        ? 'text-yellow-600'
        : score >= 40
          ? 'text-orange-600'
          : 'text-gray-500';

  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-1.5 text-sm hover:underline"
      title={summary}
    >
      <span className={`font-bold ${color}`}>{Math.round(score)}</span>
      <span className="text-gray-400 group-hover:text-gray-600">AI Match</span>
    </button>
  );
}
