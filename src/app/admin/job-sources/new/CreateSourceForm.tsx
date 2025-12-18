'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { createSourceAction } from '../actions';

export function CreateSourceForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    source_type: 'rss' as 'api' | 'rss' | 'scraper' | 'partner',
    search_query: 'mortgage servicing OR M&A advisory',
    search_location: '',
    feed_url: '', // RSS feed URL
    // API credentials
    publisher_id: '', // Indeed
    app_id: '', // Adzuna
    app_key: '', // Adzuna
    api_key: '', // Jooble
    sync_frequency: 'hourly' as 'hourly' | 'daily' | 'realtime',
    rate_limit_per_hour: 10,
    is_active: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Build config object based on source type
      const config: Record<string, any> = {
        search_query: formData.search_query,
        search_location: formData.search_location,
      };

      // Add API credentials based on source name
      const nameLower = formData.name.toLowerCase();
      if (nameLower.includes('indeed') && formData.publisher_id) {
        config.publisher_id = formData.publisher_id;
      }
      if (nameLower.includes('adzuna')) {
        if (!formData.app_id || !formData.app_key) {
          throw new Error('Adzuna requires both App ID and App Key');
        }
        config.app_id = formData.app_id;
        config.app_key = formData.app_key;
      }
      if (nameLower.includes('jooble')) {
        if (!formData.api_key) {
          throw new Error('Jooble requires an API Key');
        }
        config.api_key = formData.api_key;
      }

      // Add RSS feed URL if source type is RSS (but not for Indeed - it builds URL automatically)
      if (formData.source_type === 'rss' && !isIndeed) {
        if (!formData.feed_url) {
          throw new Error('RSS feed requires a feed URL (unless using Indeed, which builds the URL automatically)');
        }
        config.feed_url = formData.feed_url;
      } else if (formData.source_type === 'rss' && isIndeed && formData.feed_url) {
        // Allow feed_url for Indeed but it's optional
        config.feed_url = formData.feed_url;
      }

      await createSourceAction({
        name: formData.name,
        source_type: formData.source_type,
        is_active: formData.is_active,
        config,
        sync_frequency: formData.sync_frequency,
        rate_limit_per_hour: formData.rate_limit_per_hour,
      });

      router.push('/admin/job-sources');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create source';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const nameLower = formData.name.toLowerCase();
  const isIndeed = nameLower.includes('indeed');
  const isAdzuna = nameLower.includes('adzuna');
  const isJooble = nameLower.includes('jooble');

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Source Name *
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="e.g., Indeed RSS, Adzuna API, Jooble API"
          required
        />
        <p className="mt-1 text-xs text-gray-500">
          Include the source name (Indeed, Adzuna, Jooble) to auto-detect API fields
        </p>
      </div>

      <div>
        <label htmlFor="source_type" className="block text-sm font-medium text-gray-700">
          Source Type *
        </label>
        <select
          id="source_type"
          value={formData.source_type}
          onChange={(e) =>
            setFormData({ ...formData, source_type: e.target.value as 'api' | 'rss' | 'scraper' | 'partner' })
          }
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          required
        >
          <option value="rss">RSS Feed</option>
          <option value="api">API</option>
          <option value="scraper">Web Scraper</option>
          <option value="partner">Partner Integration</option>
        </select>
      </div>

      <div>
        <label htmlFor="search_query" className="block text-sm font-medium text-gray-700">
          Search Query
        </label>
        <input
          type="text"
          id="search_query"
          value={formData.search_query}
          onChange={(e) => setFormData({ ...formData, search_query: e.target.value })}
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
          value={formData.search_location}
          onChange={(e) => setFormData({ ...formData, search_location: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="City, State or ZIP"
        />
      </div>

      {/* API Credentials - Show based on detected source */}
      {isIndeed && (
        <div>
          <label htmlFor="publisher_id" className="block text-sm font-medium text-gray-700">
            Indeed Publisher ID (Optional)
          </label>
          <input
            type="text"
            id="publisher_id"
            value={formData.publisher_id}
            onChange={(e) => setFormData({ ...formData, publisher_id: e.target.value })}
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
              Adzuna App ID *
            </label>
            <input
              type="text"
              id="app_id"
              value={formData.app_id}
              onChange={(e) => setFormData({ ...formData, app_id: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Your Adzuna App ID"
              required={isAdzuna}
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
              Adzuna App Key *
            </label>
            <input
              type="password"
              id="app_key"
              value={formData.app_key}
              onChange={(e) => setFormData({ ...formData, app_key: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Your Adzuna App Key"
              required={isAdzuna}
            />
          </div>
        </>
      )}

      {isJooble && (
        <div>
          <label htmlFor="api_key" className="block text-sm font-medium text-gray-700">
            Jooble API Key *
          </label>
          <input
            type="password"
            id="api_key"
            value={formData.api_key}
            onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Your Jooble API Key"
            required={isJooble}
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

      {formData.source_type === 'rss' && (
        <div>
          <label htmlFor="feed_url" className="block text-sm font-medium text-gray-700">
            RSS Feed URL {!isIndeed && '*'}
          </label>
          <input
            type="url"
            id="feed_url"
            value={formData.feed_url}
            onChange={(e) => setFormData({ ...formData, feed_url: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder={isIndeed ? "Leave empty - URL built automatically from search query" : "https://example.com/careers/rss"}
            required={formData.source_type === 'rss' && !isIndeed}
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
            value={formData.sync_frequency}
            onChange={(e) =>
              setFormData({ ...formData, sync_frequency: e.target.value as 'hourly' | 'daily' | 'realtime' })
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
            value={formData.rate_limit_per_hour}
            onChange={(e) =>
              setFormData({ ...formData, rate_limit_per_hour: parseInt(e.target.value, 10) || 10 })
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
          checked={formData.is_active}
          onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
          Active (enable automatic syncing)
        </label>
      </div>

      <div className="flex items-center gap-3 border-t border-gray-200 pt-6">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Source'}
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

