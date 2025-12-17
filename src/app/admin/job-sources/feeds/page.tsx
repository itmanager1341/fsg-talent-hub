import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getAllFeedHealth } from '@/lib/services/feed-monitoring';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { FeedDiscoveryForm } from './FeedDiscoveryForm';

export const metadata = {
  title: 'Feed Health | Job Sources | Admin | FSG Talent Hub',
};

function getHealthBadge(isHealthy: boolean, consecutiveFailures: number): React.ReactNode {
  if (consecutiveFailures >= 3) {
    return (
      <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
        Unhealthy
      </span>
    );
  }
  if (consecutiveFailures > 0) {
    return (
      <span className="rounded-full bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700">
        Warning
      </span>
    );
  }
  return (
    <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
      Healthy
    </span>
  );
}

export default async function FeedHealthPage() {
  const supabase = await createClient();
  
  // Get all RSS sources
  const { data: rssSources } = await supabase
    .from('job_sources')
    .select('*')
    .eq('source_type', 'rss')
    .order('name');

  const healthData = await getAllFeedHealth();

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">RSS Feed Health</h1>
          <p className="mt-1 text-gray-600">
            Monitor RSS feed availability and health status.
          </p>
        </div>
        <Link href="/admin/job-sources">
          <Button variant="outline">Back to Sources</Button>
        </Link>
      </div>

      {/* Feed Health Table */}
      <Card>
        <CardContent className="pt-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Feed Status</h2>
          {healthData.length === 0 ? (
            <p className="text-sm text-gray-500">No RSS feeds configured.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Source
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Last Check
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Items
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Avg Items
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Failures
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Response Time
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Last Success
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {healthData.map((health) => (
                    <tr key={health.source_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-gray-900">{health.source_name}</div>
                          <div className="text-xs text-gray-500 truncate max-w-xs">
                            {health.feed_url}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {getHealthBadge(health.is_healthy, health.consecutive_failures)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(health.last_check).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {health.last_item_count}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {health.average_items_per_fetch}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {health.consecutive_failures > 0 ? (
                          <span className="text-red-600">{health.consecutive_failures}</span>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {health.response_time_ms ? `${health.response_time_ms}ms` : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {health.last_successful_fetch
                          ? new Date(health.last_successful_fetch).toLocaleDateString()
                          : 'Never'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feed Discovery */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Feed Discovery</h2>
          <p className="mb-4 text-sm text-gray-600">
            Discover RSS feeds from company career pages. Enter a company website URL to search for
            available RSS feeds.
          </p>
          <FeedDiscoveryForm />
        </CardContent>
      </Card>
    </div>
  );
}
