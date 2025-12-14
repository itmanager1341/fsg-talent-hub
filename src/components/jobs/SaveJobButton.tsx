'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toggleSaveJob } from '@/lib/actions/jobs';

interface SaveJobButtonProps {
  jobId: string;
  candidateId: string | null;
  isSaved: boolean;
}

export function SaveJobButton({
  jobId,
  candidateId,
  isSaved: initialSaved,
}: SaveJobButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSaved, setIsSaved] = useState(initialSaved);

  const handleClick = () => {
    if (!candidateId) {
      router.push(`/signin?next=/jobs/${jobId}`);
      return;
    }

    startTransition(async () => {
      const result = await toggleSaveJob(jobId, candidateId, isSaved);
      if (!result.error) {
        setIsSaved(!isSaved);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition ${
        isSaved
          ? 'border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100'
          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
      } ${isPending ? 'opacity-50' : ''}`}
      aria-label={isSaved ? 'Remove from saved jobs' : 'Save job'}
    >
      <svg
        className={`h-5 w-5 ${isSaved ? 'fill-current' : ''}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
        />
      </svg>
      {isPending ? 'Saving...' : isSaved ? 'Saved' : 'Save Job'}
    </button>
  );
}
