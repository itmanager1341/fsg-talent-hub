'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import type { JobSource } from '@/lib/services/job-sources';

interface SourceConfigFormProps {
  source: JobSource;
}

export function SourceConfigForm({ source }: SourceConfigFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState({
    name: source.name,
    is_active: source.is_active,
    search_query: (source.config as any)?.search_query || 'mortgage servicing OR M&A advisory',
    search_location: (source.config as any)?.search_location || '',
    publisher_id: (source.config as any)?.publisher_id || '',
    sync_frequency: source.sync_frequency,
    rate_limit_per_hour: source.rate_limit_per_hour || 10,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/job-sources/${source.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: config.name,
          is_active: config.is_active,
          config: {
            search_query: config.search_query,
            search_location: config.search_location,
            publisher_id: config.publisher_id,
          },
          sync_frequency: config.sync_frequency,
          rate_limit_per_hour: config.rate_limit_per_hour,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update source');
      }

      router.refresh();
      router.push('/admin/job-sources');
    } catch (error) {
      console.error('Error updating source:', error);
      alert('Failed to update source. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Source Name
        </label>
        <input
          type="text"
          id="name"
          value={config.name}
          onChange={(e) => setConfig({ ...config, name: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          required
        />
      </div>

      <div>
        <label htmlFor="search_query" className="block text-sm font-medium text-gray-700">
          Search Query
        </label>
        <input
          type="text"
          id="search_query"
          value={config.search_query}
          onChange={(e) => setConfig({ ...config, search_query: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          placeholder="mortgage servicing OR M&A advisory"
        />
        <p className="mt-1 text-xs text-gray-500">
          Indeed search query (supports OR, AND, quotes for exact phrases)
        </p>
      </div>

      <div>
        <label htmlFor="search_location" className="block text-sm font-medium text-gray-700">
          Location (Optional)
        </label>
        <input
          type="text"
          id="search_location"
          value={config.search_location}
          onChange={(e) => setConfig({ ...config, search_location: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          placeholder="City, State or ZIP"
        />
      </div>

      <div>
        <label htmlFor="publisher_id" className="block text-sm font-medium text-gray-700">
          Publisher ID (Optional)
        </label>
        <input
          type="text"
          id="publisher_id"
          value={config.publisher_id}
          onChange={(e) => setConfig({ ...config, publisher_id: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          placeholder="Indeed Publisher ID for API access"
        />
        <p className="mt-1 text-xs text-gray-500">
          Leave empty to use RSS feed (free, no API key required)
        </p>
      </div>

      <div>
        <label htmlFor="sync_frequency" className="block text-sm font-medium text-gray-700">
          Sync Frequency
        </label>
        <select
          id="sync_frequency"
          value={config.sync_frequency}
          onChange={(e) =>
            setConfig({ ...config, sync_frequency: e.target.value as 'hourly' | 'daily' | 'realtime' })
          }
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="hourly">Hourly</option>
          <option value="daily">Daily</option>
          <option value="realtime">Real-time</option>
        </select>
      </div>

      <div>
        <label htmlFor="rate_limit" className="block text-sm font-medium text-gray-700">
          Rate Limit (per hour)
        </label>
        <input
          type="number"
          id="rate_limit"
          value={config.rate_limit_per_hour}
          onChange={(e) =>
            setConfig({ ...config, rate_limit_per_hour: parseInt(e.target.value, 10) })
          }
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          min="1"
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="is_active"
          checked={config.is_active}
          onChange={(e) => setConfig({ ...config, is_active: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
          Active (enable automatic syncing)
        </label>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/job-sources')}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

