import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { StatCard } from '@/components/admin/StatCard';
import { Button } from '@/components/ui/Button';
import {
  getAllJobSources,
  getSyncLogs,
  getJobSourcesStats,
} from './actions';
import { SyncButton } from './SyncButton';

export const metadata = {
  title: 'Job Sources | Admin | FSG Talent Hub',
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'success':
      return 'bg-green-100 text-green-700';
    case 'running':
      return 'bg-blue-100 text-blue-700';
    case 'failed':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

function getSourceStatusBadge(isActive: boolean): React.ReactNode {
  return isActive ? (
    <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
      Active
    </span>
  ) : (
    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
      Inactive
    </span>
  );
}

export default async function JobSourcesPage() {
  const [sources, syncLogs, stats] = await Promise.all([
    getAllJobSources(),
    getSyncLogs(undefined, 10),
    getJobSourcesStats(),
  ]);

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Sources</h1>
          <p className="mt-1 text-gray-600">
            Manage external job sources and sync jobs from Indeed, Adzuna, and other providers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/job-sources/imports">
            <Button variant="outline">
              Import Queue
              {stats.pendingImports > 0 && (
                <span className="ml-2 rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
                  {stats.pendingImports}
                </span>
              )}
            </Button>
          </Link>
          <Link href="/admin/job-sources/quality">
            <Button variant="outline">Quality Metrics</Button>
          </Link>
          <Link href="/admin/job-sources/feeds">
            <Button variant="outline">Feed Health</Button>
          </Link>
        </div>
      </div>

      {/* Stats Section */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Sources"
          value={stats.activeSources}
          subtitle="Configured job sources"
        />
        <StatCard
          title="Jobs Ingested Today"
          value={stats.jobsIngestedToday}
          subtitle="New jobs from all sources"
        />
        <Link href="/admin/job-sources/imports">
          <StatCard
            title="Pending Imports"
            value={stats.pendingImports}
            subtitle="Awaiting review"
            className="cursor-pointer hover:bg-gray-50 transition-colors"
          />
        </Link>
        <StatCard
          title="Match Rate"
          value={`${stats.matchRate}%`}
          subtitle="Companies matched"
        />
      </div>

      <div className="max-w-4xl">
        {/* Source Management Card */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Configured Sources</h2>
              <Link href="/admin/job-sources/new">
                <Button size="sm">Add Source</Button>
              </Link>
            </div>

            {sources.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-500 mb-4">No job sources configured yet.</p>
                <Link href="/admin/job-sources/new">
                  <Button size="sm">Add Your First Source</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {sources.map((source) => (
                  <div
                    key={source.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium text-gray-900">{source.name}</h3>
                        {getSourceStatusBadge(source.is_active)}
                        <span className="text-sm text-gray-500">
                          {source.source_type}
                        </span>
                      </div>
                      {source.last_synced_at && (
                        <p className="mt-1 text-sm text-gray-500">
                          Last synced: {formatDate(source.last_synced_at)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/job-sources/${source.id}`}>
                        <Button variant="outline" size="sm">
                          Configure
                        </Button>
                      </Link>
                      <SyncButton sourceId={source.id} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sync History Table */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="mb-4 font-semibold text-gray-900">Sync History</h2>

            {syncLogs.length === 0 ? (
              <p className="text-sm text-gray-500">No sync history yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="pb-3 pr-4">Started</th>
                      <th className="pb-3 pr-4">Status</th>
                      <th className="pb-3 pr-4">Found</th>
                      <th className="pb-3 pr-4">New</th>
                      <th className="pb-3 pr-4">Updated</th>
                      <th className="pb-3 pr-4">Duplicates</th>
                      <th className="pb-3">Errors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {syncLogs.map((log) => (
                      <tr key={log.id} className="border-b last:border-0">
                        <td className="py-3 pr-4">{formatDate(log.started_at)}</td>
                        <td className="py-3 pr-4">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(log.status)}`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="py-3 pr-4">{log.jobs_found}</td>
                        <td className="py-3 pr-4 text-green-600">+{log.jobs_new}</td>
                        <td className="py-3 pr-4 text-blue-600">{log.jobs_updated}</td>
                        <td className="py-3 pr-4">{log.jobs_duplicates}</td>
                        <td className="py-3">
                          {log.errors && Array.isArray(log.errors) && log.errors.length > 0 ? (
                            <span className="text-red-600">{log.errors.length}</span>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

