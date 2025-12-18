import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getEmployerProspects, getHubSpotSyncStatus } from '@/lib/services/employer-prospecting';
import Link from 'next/link';
import { HubSpotSyncButton } from './HubSpotSyncButton';

export const metadata = {
  title: 'Employer Prospects | Admin | FSG Talent Hub',
};

function getOutreachBadge(status: string): React.ReactNode {
  const badges: Record<string, { label: string; className: string }> = {
    pending: {
      label: 'Pending',
      className: 'rounded-full bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800',
    },
    contacted: {
      label: 'Contacted',
      className: 'rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700',
    },
    responded: {
      label: 'Responded',
      className: 'rounded-full bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700',
    },
    converted: {
      label: 'Converted',
      className: 'rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700',
    },
    rejected: {
      label: 'Rejected',
      className: 'rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700',
    },
  };

  const badge = badges[status] || badges.pending;
  return <span className={badge.className}>{badge.label}</span>;
}

function getEnrichmentBadge(status: string): React.ReactNode {
  if (status === 'enriched') {
    return (
      <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
        Enriched
      </span>
    );
  }
  if (status === 'failed') {
    return (
      <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
        Failed
      </span>
    );
  }
  return (
    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
      Pending
    </span>
  );
}

export default async function EmployerProspectsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; enrichment?: string }>;
}) {
  const params = await searchParams;
  const [prospects, syncStatus] = await Promise.all([
    getEmployerProspects({
      outreach_status: params.status as any,
      enrichment_status: params.enrichment as any,
    }),
    getHubSpotSyncStatus(),
  ]);

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Employer Prospects</h1>
        <p className="mt-1 text-gray-600">
          Companies identified from external job listings that could become employers.
        </p>
      </div>

      {/* HubSpot Sync Status */}
      <div className="mb-6">
        <HubSpotSyncButton
          pendingCount={syncStatus.pending}
          syncedCount={syncStatus.synced}
          errorCount={syncStatus.error}
        />
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Link href="/admin/employer-prospects">
          <Button variant="outline" size="sm">
            All
          </Button>
        </Link>
        <Link href="/admin/employer-prospects?status=pending">
          <Button variant="outline" size="sm">
            Pending
          </Button>
        </Link>
        <Link href="/admin/employer-prospects?status=contacted">
          <Button variant="outline" size="sm">
            Contacted
          </Button>
        </Link>
        <Link href="/admin/employer-prospects?status=converted">
          <Button variant="outline" size="sm">
            Converted
          </Button>
        </Link>
      </div>

      {/* Prospects Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">{prospects.length} prospects</p>
          </div>

          {prospects.length === 0 ? (
            <p className="text-sm text-gray-500">No prospects found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                    <th className="py-2 pr-4">Company</th>
                    <th className="py-2 pr-4">Jobs</th>
                    <th className="py-2 pr-4">Enrichment</th>
                    <th className="py-2 pr-4">Outreach</th>
                    <th className="py-2 pr-4">HubSpot</th>
                    <th className="py-2 pr-4">First Seen</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {prospects.map((prospect) => (
                    <tr key={prospect.id} className="border-b border-gray-100">
                      <td className="py-3 pr-4">
                        <div>
                          <div className="font-medium text-gray-900">{prospect.company_name}</div>
                          {prospect.company_url && (
                            <a
                              href={prospect.company_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline"
                            >
                              {prospect.company_url}
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-gray-600">{prospect.job_count}</td>
                      <td className="py-3 pr-4">{getEnrichmentBadge(prospect.enrichment_status)}</td>
                      <td className="py-3 pr-4">{getOutreachBadge(prospect.outreach_status)}</td>
                      <td className="py-3 pr-4">
                        {prospect.hubspot_company_id ? (
                          <a
                            href={`https://app.hubspot.com/contacts/${prospect.hubspot_company_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline"
                          >
                            View
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-gray-600">
                        {new Date(prospect.first_seen_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/employer-prospects/${prospect.id}`}>
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                          </Link>
                        </div>
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
  );
}

