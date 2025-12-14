'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { updateJobStatus, deleteJob } from '../../actions';

interface JobStatusControlsProps {
  jobId: string;
  currentStatus: string;
}

const statusConfig: Record<
  string,
  { label: string; color: string; actions: string[] }
> = {
  draft: {
    label: 'Draft',
    color: 'bg-gray-100 text-gray-700',
    actions: ['active'],
  },
  active: {
    label: 'Active',
    color: 'bg-green-100 text-green-700',
    actions: ['paused', 'closed'],
  },
  paused: {
    label: 'Paused',
    color: 'bg-yellow-100 text-yellow-700',
    actions: ['active', 'closed'],
  },
  closed: {
    label: 'Closed',
    color: 'bg-red-100 text-red-700',
    actions: ['active'],
  },
};

const actionLabels: Record<string, string> = {
  active: 'Publish',
  paused: 'Pause',
  closed: 'Close',
};

export function JobStatusControls({
  jobId,
  currentStatus,
}: JobStatusControlsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const config = statusConfig[currentStatus] || statusConfig.draft;

  const handleStatusChange = (newStatus: string) => {
    setError(null);
    startTransition(async () => {
      const result = await updateJobStatus(
        jobId,
        newStatus as 'draft' | 'active' | 'paused' | 'closed'
      );
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  };

  const handleDelete = () => {
    if (
      !confirm(
        'Are you sure you want to delete this job? This action cannot be undone and will remove all associated applications.'
      )
    ) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await deleteJob(jobId);
      if (result.error) {
        setError(result.error);
      } else {
        router.push('/employers/dashboard');
      }
    });
  };

  return (
    <div>
      <div className="flex items-center gap-4">
        <span
          className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${config.color}`}
        >
          {config.label}
        </span>

        <div className="flex gap-2">
          {config.actions.map((action) => (
            <Button
              key={action}
              size="sm"
              variant={action === 'active' ? 'primary' : 'outline'}
              onClick={() => handleStatusChange(action)}
              disabled={isPending}
            >
              {actionLabels[action] || action}
            </Button>
          ))}
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={handleDelete}
          disabled={isPending}
          className="ml-auto text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          Delete Job
        </Button>
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
