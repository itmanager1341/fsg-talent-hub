'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface JobSourceSyncButtonProps {
  sourceId: string;
  onSyncComplete?: () => void;
}

export function JobSourceSyncButton({
  sourceId,
  onSyncComplete,
}: JobSourceSyncButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSync = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/job-sources/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId }),
      });

      if (!response.ok) {
        throw new Error('Sync failed');
      }

      if (onSyncComplete) {
        onSyncComplete();
      }
    } catch (error) {
      console.error('Error triggering sync:', error);
      alert('Failed to trigger sync. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSync}
      disabled={isLoading}
    >
      {isLoading ? 'Syncing...' : 'Sync Now'}
    </Button>
  );
}

