'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { updateSourceAction } from '../actions';
import type { JobSource } from '@/lib/services/job-sources';

interface SourceConfigFormProps {
  source: JobSource;
}

export function SourceConfigForm({ source }: SourceConfigFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const configData = source.config as Record<string, any>;
  const [config, setConfig] = useState({
    name: source.name,
    is_active: source.is_active,
    search_query: configData?.search_query || 'mortgage servicing OR M&A advisory',
    search_location: configData?.search_location || '',
    feed_url: configData?.feed_url || '', // RSS feed URL
    // API credentials - show based on source type
    publisher_id: configData?.publisher_id || '', // Indeed
    app_id: configData?.app_id || '', // Adzuna
    app_key: configData?.app_key || '', // Adzuna
    api_key: configData?.api_key || '', // Jooble
    sync_frequency: source.sync_frequency,
    rate_limit_per_hour: source.rate_limit_per_hour || 10,
  });

  const isIndeed = source.name.toLowerCase().includes('indeed');
  const isAdzuna = source.name.toLowerCase().includes('adzuna');
  const isJooble = source.name.toLowerCase().includes('jooble');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Build config object based on source type
      const configObj: Record<string, any> = {
        search_query: config.search_query,
        search_location: config.search_location,
      };

      // Add RSS feed URL if source type is RSS (optional for Indeed)
      if (source.source_type === 'rss') {
        if (!isIndeed && !config.feed_url) {
          throw new Error('RSS feed requires a feed URL (unless using Indeed, which builds the URL automatically)');
        }
        if (config.feed_url) {
          configObj.feed_url = config.feed_url;
        }
      }

      if (isIndeed && config.publisher_id) {
        configObj.publisher_id = config.publisher_id;
      }
      if (isAdzuna) {
        configObj.app_id = config.app_id;
        configObj.app_key = config.app_key;
      }
      if (isJooble) {
        configObj.api_key = config.api_key;
      }

      await updateSourceAction(source.id, {
        name: config.name,
        is_active: config.is_active,
        config: configObj,
        sync_frequency: config.sync_frequency,
        rate_limit_per_hour: config.rate_limit_per_hour,
      });

      setSuccess(true);
      setTimeout(() => {
        router.refresh();
        router.push('/admin/job-sources');
      }, 1000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update source';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-md bg-green-50 p-4">
          <p className="text-sm text-green-800">Source updated successfully!</p>
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Source Name
        </label>
        <input
          type="text"
          id="name"
          value={config.name}
          onChange={(e) => setConfig({ ...config, name: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="mortgage servicing OR M&A advisory"
        />
        <p className="mt-1 text-xs text-gray-500">
          Search keywords (supports OR, AND, quotes for exact phrases)
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
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="City, State or ZIP"
        />
      </div>

      {/* API Credentials - Show based on source type */}
      {isIndeed && (
        <div>
          <label htmlFor="publisher_id" className="block text-sm font-medium text-gray-700">
            Publisher ID (Optional)
          </label>
          <input
            type="text"
            id="publisher_id"
            value={config.publisher_id}
            onChange={(e) => setConfig({ ...config, publisher_id: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Indeed Publisher ID for API access"
          />
          <p className="mt-1 text-xs text-gray-500">
            Leave empty to use RSS feed (free, no API key required)
          </p>
        </div>
      )}

      {isAdzuna && (
        <>
          <div>
            <label htmlFor="app_id" className="block text-sm font-medium text-gray-700">
              Adzuna App ID
            </label>
            <input
              type="text"
              id="app_id"
              value={config.app_id}
              onChange={(e) => setConfig({ ...config, app_id: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Your Adzuna App ID"
            />
            <p className="mt-1 text-xs text-gray-500">
              Get your API credentials from{' '}
              <a
                href="https://developer.adzuna.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Adzuna Developer Portal
              </a>
            </p>
          </div>
          <div>
            <label htmlFor="app_key" className="block text-sm font-medium text-gray-700">
              Adzuna App Key
            </label>
            <input
              type="password"
              id="app_key"
              value={config.app_key}
              onChange={(e) => setConfig({ ...config, app_key: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Your Adzuna App Key"
            />
          </div>
        </>
      )}

      {isJooble && (
        <div>
          <label htmlFor="api_key" className="block text-sm font-medium text-gray-700">
            Jooble API Key
          </label>
          <input
            type="password"
            id="api_key"
            value={config.api_key}
            onChange={(e) => setConfig({ ...config, api_key: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Your Jooble API Key"
          />
          <p className="mt-1 text-xs text-gray-500">
            Get your API key from{' '}
            <a
              href="https://jooble.org/api/about"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Jooble API Documentation
            </a>
          </p>
        </div>
      )}

      {source.source_type === 'rss' && (
        <div>
          <label htmlFor="feed_url" className="block text-sm font-medium text-gray-700">
            RSS Feed URL {!isIndeed && '*'}
          </label>
          <input
            type="url"
            id="feed_url"
            value={config.feed_url}
            onChange={(e) => setConfig({ ...config, feed_url: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder={isIndeed ? "Leave empty - URL built automatically from search query" : "https://example.com/careers/rss"}
            required={source.source_type === 'rss' && !isIndeed}
          />
          <p className="mt-1 text-xs text-gray-500">
            {isIndeed 
              ? "For Indeed sources, leave empty - the system builds the RSS URL automatically from your search query and location."
              : "Enter the RSS feed URL. Common patterns: /careers/rss, /jobs/feed, /employment/rss"}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
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
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
              setConfig({ ...config, rate_limit_per_hour: parseInt(e.target.value, 10) || 10 })
            }
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            min="1"
          />
        </div>
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

      <div className="flex items-center gap-3 border-t border-gray-200 pt-6">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/job-sources')}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
