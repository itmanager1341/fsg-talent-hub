'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { triggerHubSpotSyncAction } from './actions';

interface HubSpotSyncButtonProps {
  pendingCount: number;
  syncedCount: number;
  errorCount: number;
}

export function HubSpotSyncButton({ pendingCount, syncedCount, errorCount }: HubSpotSyncButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{
    synced?: number;
    failed?: number;
    errors?: string[];
  } | null>(null);

  const handleSync = () => {
    setResult(null);
    startTransition(async () => {
      const response = await triggerHubSpotSyncAction();
      if (response.success && response.result) {
        setResult(response.result);
      } else if (response.error) {
        setResult({ errors: [response.error] });
      }
    });
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-900">HubSpot Sync Status</h3>
          <div className="mt-1 flex items-center gap-4 text-sm">
            <span className="text-yellow-600">{pendingCount} pending</span>
            <span className="text-green-600">{syncedCount} synced</span>
            {errorCount > 0 && <span className="text-red-600">{errorCount} errors</span>}
          </div>
        </div>
        <Button
          onClick={handleSync}
          disabled={isPending || pendingCount === 0}
          variant="primary"
          size="sm"
        >
          {isPending ? 'Syncing...' : `Sync to HubSpot (${pendingCount})`}
        </Button>
      </div>

      {result && (
        <div className="mt-3 rounded-md bg-gray-50 p-3 text-sm">
          {result.synced !== undefined && (
            <p className="text-green-700">Synced: {result.synced} companies</p>
          )}
          {result.failed !== undefined && result.failed > 0 && (
            <p className="text-red-700">Failed: {result.failed} companies</p>
          )}
          {result.errors && result.errors.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium text-red-700">Errors:</p>
              <ul className="mt-1 list-inside list-disc text-xs text-red-600">
                {result.errors.slice(0, 5).map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
                {result.errors.length > 5 && (
                  <li>...and {result.errors.length - 5} more</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
