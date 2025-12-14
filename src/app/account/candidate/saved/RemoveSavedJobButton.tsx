'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { removeSavedJob } from './actions';

interface RemoveSavedJobButtonProps {
  savedJobId: string;
  candidateId: string;
}

export function RemoveSavedJobButton({
  savedJobId,
  candidateId,
}: RemoveSavedJobButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleRemove = () => {
    startTransition(async () => {
      await removeSavedJob(savedJobId, candidateId);
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={handleRemove}
      disabled={isPending}
      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
    >
      {isPending ? 'Removing...' : 'Remove'}
    </button>
  );
}
