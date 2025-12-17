import { createClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/Card';
import { HubSpotSyncButton } from './HubSpotSyncButton';

export const metadata = {
  title: 'HubSpot Sync | Admin | FSG Talent Hub',
};

interface SyncLog {
  id: string;
  sync_type: string;
  started_at: string;
  completed_at: string | null;
  records_processed: number;
  records_created: number;
  records_updated: number;
  records_errored: number;
  status: string;
}

async function getSyncLogs(): Promise<SyncLog[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('hubspot_sync_logs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching sync logs:', error);
    return [];
  }

  return data || [];
}

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
    case 'completed':
      return 'bg-green-100 text-green-700';
    case 'running':
      return 'bg-blue-100 text-blue-700';
    case 'failed':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

export default async function HubSpotSyncPage() {
  const logs = await getSyncLogs();

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">HubSpot Sync</h1>
        <p className="mt-1 text-gray-600">
          Sync companies from HubSpot CRM to the platform.
        </p>
      </div>

      <div className="max-w-4xl">
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">Manual Sync</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Trigger a sync to import new companies from HubSpot.
                  Existing companies will be updated.
                </p>
              </div>
              <HubSpotSyncButton />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h2 className="mb-4 font-semibold text-gray-900">Sync History</h2>

            {logs.length === 0 ? (
              <p className="text-sm text-gray-500">No sync history yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="pb-3 pr-4">Started</th>
                      <th className="pb-3 pr-4">Status</th>
                      <th className="pb-3 pr-4">Processed</th>
                      <th className="pb-3 pr-4">Created</th>
                      <th className="pb-3 pr-4">Updated</th>
                      <th className="pb-3">Errors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b last:border-0">
                        <td className="py-3 pr-4">
                          {formatDate(log.started_at)}
                        </td>
                        <td className="py-3 pr-4">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(log.status)}`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="py-3 pr-4">{log.records_processed}</td>
                        <td className="py-3 pr-4 text-green-600">
                          +{log.records_created}
                        </td>
                        <td className="py-3 pr-4 text-blue-600">
                          {log.records_updated}
                        </td>
                        <td className="py-3">
                          {log.records_errored > 0 ? (
                            <span className="text-red-600">
                              {log.records_errored}
                            </span>
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
