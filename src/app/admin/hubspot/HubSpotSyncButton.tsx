'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabaseClient';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export function HubSpotSyncButton() {
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSync() {
    setIsSyncing(true);
    setError(null);
    setSuccess(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setError('Please sign in to trigger sync');
        return;
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/hubspot-sync`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Sync failed');
        return;
      }

      setSuccess(
        `Sync complete: ${data.companies_created} created, ${data.companies_updated} updated`
      );

      // Refresh the page to show updated sync logs
      router.refresh();
    } catch (err) {
      console.error('Sync error:', err);
      setError('Failed to connect to sync service');
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button onClick={handleSync} disabled={isSyncing}>
        {isSyncing ? 'Syncing...' : 'Sync Now'}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">{success}</p>}
    </div>
  );
}
