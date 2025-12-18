'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { triggerSyncAction } from './actions';
import { useRouter } from 'next/navigation';

interface SyncButtonProps {
  sourceId: string;
}

export function SyncButton({ sourceId }: SyncButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSync() {
    setIsLoading(true);
    setMessage(null);
    setError(null);

    try {
      await triggerSyncAction(sourceId);
      setMessage('Sync started successfully! Check sync history for results.');
      // Refresh the page after a short delay to show updated stats
      setTimeout(() => {
        router.refresh();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start sync');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="outline"
        size="sm"
        onClick={handleSync}
        disabled={isLoading}
      >
        {isLoading ? 'Syncing...' : 'Sync Now'}
      </Button>
      {message && (
        <p className="text-xs text-green-600">{message}</p>
      )}
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}

