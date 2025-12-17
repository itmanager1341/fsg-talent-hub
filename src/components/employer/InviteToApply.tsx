'use client';

import { useState, useTransition, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { inviteToApply, getCompanyActiveJobs } from '@/app/employers/candidates/actions';

interface InviteToApplyProps {
  candidateId: string;
  candidateName: string;
  onSuccess?: () => void;
  onClose?: () => void;
}

export function InviteToApply({
  candidateId,
  candidateName,
  onSuccess,
  onClose,
}: InviteToApplyProps) {
  const [isPending, startTransition] = useTransition();
  const [jobs, setJobs] = useState<{ id: string; title: string }[]>([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);

  useEffect(() => {
    async function loadJobs() {
      const result = await getCompanyActiveJobs();
      if (result.jobs) {
        setJobs(result.jobs);
      }
      setIsLoadingJobs(false);
    }
    loadJobs();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobId) {
      setError('Please select a job');
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await inviteToApply(
        candidateId,
        selectedJobId,
        message.trim() || undefined
      );

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        onSuccess?.();
      }
    });
  };

  if (success) {
    return (
      <div className="text-center py-4">
        <div className="mx-auto h-12 w-12 text-green-500 mb-4">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Invitation Sent!
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          {candidateName} has been invited to apply.
        </p>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        )}
      </div>
    );
  }

  if (isLoadingJobs) {
    return (
      <div className="text-center py-8 text-gray-500">
        Loading jobs...
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-600 mb-4">
          You don&apos;t have any active jobs to invite candidates to.
        </p>
        <a
          href="/employers/jobs/new"
          className="text-blue-600 hover:text-blue-500 text-sm font-medium"
        >
          Create a new job posting
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="job-select"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Select a Job
        </label>
        <select
          id="job-select"
          value={selectedJobId}
          onChange={(e) => setSelectedJobId(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          required
        >
          <option value="">Choose a job...</option>
          {jobs.map((job) => (
            <option key={job.id} value={job.id}>
              {job.title}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="message"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Personal Message (optional)
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={`Write a personal message to ${candidateName}...`}
          rows={4}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          This message will be shown to the candidate along with the job details.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3">
        {onClose && (
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isPending || !selectedJobId}>
          {isPending ? 'Sending...' : 'Send Invitation'}
        </Button>
      </div>
    </form>
  );
}

// Modal wrapper component
interface InviteToApplyModalProps {
  candidateId: string;
  candidateName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function InviteToApplyModal({
  candidateId,
  candidateName,
  isOpen,
  onClose,
}: InviteToApplyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md rounded-lg bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Invite to Apply
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div className="px-6 py-4">
            <p className="text-sm text-gray-600 mb-4">
              Invite <strong>{candidateName}</strong> to apply for one of your
              open positions.
            </p>
            <InviteToApply
              candidateId={candidateId}
              candidateName={candidateName}
              onClose={onClose}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
