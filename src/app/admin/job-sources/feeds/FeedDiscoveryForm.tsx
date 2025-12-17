'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { discoverFeedAction, createSourceFromFeedAction } from './actions';
import { useRouter } from 'next/navigation';

export function FeedDiscoveryForm() {
  const router = useRouter();
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveredFeed, setDiscoveredFeed] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleDiscover = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsDiscovering(true);
    setError(null);
    setDiscoveredFeed(null);

    const formData = new FormData(e.currentTarget);
    const companyUrl = formData.get('company_url') as string;
    const companyName = formData.get('company_name') as string;

    try {
      const result = await discoverFeedAction(companyUrl, companyName);

      if (result.success && result.feed) {
        setDiscoveredFeed(result.feed);
      } else {
        setError(result.message || 'No feed found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Discovery failed');
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleCreateSource = async () => {
    if (!discoveredFeed) return;

    setIsCreating(true);
    try {
      const result = await createSourceFromFeedAction(discoveredFeed);

      if (result.success) {
        router.push('/admin/job-sources');
        router.refresh();
      } else {
        setError(result.message || 'Failed to create source');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create source');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleDiscover} className="flex gap-3">
        <input
          type="text"
          name="company_name"
          placeholder="Company Name (optional)"
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <input
          type="url"
          name="company_url"
          placeholder="https://company.com"
          required
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <Button type="submit" size="sm" disabled={isDiscovering}>
          {isDiscovering ? 'Discovering...' : 'Discover Feed'}
        </Button>
      </form>

      {error && (
        <div className="rounded-md bg-red-50 p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {discoveredFeed && (
        <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Feed Discovered!</h3>
              <p className="text-sm text-gray-600">{discoveredFeed.title}</p>
            </div>
            <Button onClick={handleCreateSource} disabled={isCreating} size="sm">
              {isCreating ? 'Creating...' : 'Create Source'}
            </Button>
          </div>
          <div className="space-y-1 text-sm">
            <div>
              <span className="font-medium text-gray-700">URL:</span>{' '}
              <a
                href={discoveredFeed.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {discoveredFeed.url}
              </a>
            </div>
            {discoveredFeed.description && (
              <div>
                <span className="font-medium text-gray-700">Description:</span>{' '}
                <span className="text-gray-600">{discoveredFeed.description}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

