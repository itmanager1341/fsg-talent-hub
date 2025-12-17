import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { getImportQueue, approveImportAction, rejectImportAction } from './actions';

export const metadata = {
  title: 'Import Queue | Job Sources | Admin | FSG Talent Hub',
};

interface ImportQueueSearchParams {
  status?: 'all' | 'pending' | 'matched' | 'duplicate' | 'rejected';
}

function getStatusBadge(status: string): React.ReactNode {
  const badges: Record<string, { label: string; className: string }> = {
    matched: {
      label: 'Matched',
      className: 'rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700',
    },
    pending: {
      label: 'Pending',
      className: 'rounded-full bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800',
    },
    duplicate: {
      label: 'Duplicate',
      className: 'rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700',
    },
    rejected: {
      label: 'Rejected',
      className: 'rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700',
    },
  };

  const badge = badges[status] || badges.pending;
  return <span className={badge.className}>{badge.label}</span>;
}

function formatMatchConfidence(confidence: number | null): string {
  if (confidence === null) return '—';
  return `${Math.round(confidence * 100)}%`;
}

export default async function ImportQueuePage({
  searchParams,
}: {
  searchParams: Promise<ImportQueueSearchParams>;
}) {
  const params = await searchParams;
  const status = params.status || 'all';
  const imports = await getImportQueue(status === 'all' ? undefined : status);

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Import Queue</h1>
        <p className="mt-1 text-gray-600">
          Review and approve external jobs for import into the platform.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Link href="/admin/job-sources/imports">
          <Button variant="outline" size="sm">
            All
          </Button>
        </Link>
        <Link href="/admin/job-sources/imports?status=pending">
          <Button variant="outline" size="sm">
            Pending
          </Button>
        </Link>
        <Link href="/admin/job-sources/imports?status=matched">
          <Button variant="outline" size="sm">
            Matched
          </Button>
        </Link>
        <Link href="/admin/job-sources/imports?status=duplicate">
          <Button variant="outline" size="sm">
            Duplicates
          </Button>
        </Link>
        <Link href="/admin/job-sources/imports?status=rejected">
          <Button variant="outline" size="sm">
            Rejected
          </Button>
        </Link>
      </div>

      {/* Content */}
      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">{imports.length} jobs in queue</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                  <th className="py-2 pr-4">Title</th>
                  <th className="py-2 pr-4">Company</th>
                  <th className="py-2 pr-4">Source</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Match Confidence</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {imports.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100">
                    <td className="py-3 pr-4 font-medium text-gray-900">
                      {item.external_job.title}
                    </td>
                    <td className="py-3 pr-4 text-gray-600">
                      {item.external_job.company_name || '—'}
                    </td>
                    <td className="py-3 pr-4 text-gray-600">
                      {item.external_job.source_id.substring(0, 8)}...
                    </td>
                    <td className="py-3 pr-4">
                      {getStatusBadge(item.external_job.status)}
                    </td>
                    <td className="py-3 pr-4 text-gray-600">
                      {formatMatchConfidence(item.external_job.match_confidence)}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {item.external_job.status === 'matched' && (
                          <form
                            action={approveImportAction.bind(null, item.external_job_id)}
                          >
                            <Button variant="outline" size="sm" type="submit">
                              Import
                            </Button>
                          </form>
                        )}
                        {item.external_job.status !== 'rejected' && (
                          <form
                            action={rejectImportAction.bind(null, item.external_job_id)}
                          >
                            <Button variant="outline" size="sm" type="submit">
                              Reject
                            </Button>
                          </form>
                        )}
                        <Link href={`/admin/job-sources/imports/${item.external_job_id}`}>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
                {imports.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-gray-600">
                      No jobs match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

