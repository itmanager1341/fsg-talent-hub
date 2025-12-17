'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { bulkRankApplicants } from './actions';

interface BulkRankButtonProps {
  jobId: string;
  unrankedCount: number;
}

export function BulkRankButton({ jobId, unrankedCount }: BulkRankButtonProps) {
  const router = useRouter();
  const [isRanking, setIsRanking] = useState(false);
  const [result, setResult] = useState<{
    ranked?: number;
    failed?: number;
    error?: string;
  } | null>(null);

  const handleBulkRank = async () => {
    setIsRanking(true);
    setResult(null);

    try {
      const response = await bulkRankApplicants(jobId);
      setResult(response);

      if (response.ranked && response.ranked > 0) {
        router.refresh();
      }
    } catch {
      setResult({ error: 'Failed to rank applicants' });
    } finally {
      setIsRanking(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {result && (
        <span className="text-sm">
          {result.error ? (
            <span className="text-red-600">{result.error}</span>
          ) : (
            <span className="text-green-600">
              Ranked {result.ranked} applicant{result.ranked !== 1 ? 's' : ''}
              {result.failed ? `, ${result.failed} failed` : ''}
            </span>
          )}
        </span>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={handleBulkRank}
        disabled={isRanking || unrankedCount === 0}
      >
        {isRanking ? (
          <>
            <svg
              className="mr-2 h-4 w-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Ranking...
          </>
        ) : (
          <>
            Rank All ({unrankedCount})
          </>
        )}
      </Button>
    </div>
  );
}
