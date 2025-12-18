'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { approveImportAction, rejectImportAction } from './actions';
import { useRouter } from 'next/navigation';

interface ImportActionsProps {
  externalJobId: string;
  status: string;
}

export function ImportActions({ externalJobId, status }: ImportActionsProps) {
  const router = useRouter();
  const [isImporting, setIsImporting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleImport() {
    setIsImporting(true);
    setMessage(null);
    setError(null);

    try {
      const result = await approveImportAction(externalJobId);
      if (result.success) {
        setMessage('Job imported successfully!');
        // Refresh the page after a short delay
        setTimeout(() => {
          router.refresh();
        }, 1500);
      } else {
        setError(result.error || 'Failed to import job');
        setIsImporting(false);
      }
    } catch (err) {
      console.error('Import error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to import job';
      setError(errorMessage);
      setIsImporting(false);
    }
  }

  async function handleReject() {
    if (!confirm('Are you sure you want to reject this job?')) {
      return;
    }

    setIsRejecting(true);
    setMessage(null);
    setError(null);

    try {
      const result = await rejectImportAction(externalJobId);
      if (result.success) {
        setMessage('Job rejected.');
        // Refresh the page after a short delay
        setTimeout(() => {
          router.refresh();
        }, 1500);
      } else {
        setError(result.error || 'Failed to reject job');
        setIsRejecting(false);
      }
    } catch (err) {
      console.error('Reject error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to reject job';
      setError(errorMessage);
      setIsRejecting(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        {(status === 'matched' || status === 'pending') && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleImport}
            disabled={isImporting || isRejecting}
          >
            {isImporting ? 'Importing...' : 'Import'}
          </Button>
        )}
        {status !== 'rejected' && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleReject}
            disabled={isImporting || isRejecting}
          >
            {isRejecting ? 'Rejecting...' : 'Reject'}
          </Button>
        )}
      </div>
      {message && (
        <p className="text-xs text-green-600">{message}</p>
      )}
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}

