import { Card, CardContent } from '@/components/ui/Card';
import { StatCard } from '@/components/admin/StatCard';
import { getAllSourceQualityMetrics } from '@/lib/services/source-quality';

export const metadata = {
  title: 'Source Quality | Job Sources | Admin | FSG Talent Hub',
};

function getQualityColor(score: number): string {
  if (score >= 0.8) return 'text-green-600';
  if (score >= 0.6) return 'text-yellow-600';
  return 'text-red-600';
}

function getQualityBadge(score: number): React.ReactNode {
  if (score >= 0.8) {
    return (
      <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
        Excellent
      </span>
    );
  }
  if (score >= 0.6) {
    return (
      <span className="rounded-full bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700">
        Good
      </span>
    );
  }
  return (
    <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
      Needs Improvement
    </span>
  );
}

export default async function SourceQualityPage() {
  const metrics = await getAllSourceQualityMetrics();

  const avgQualityScore =
    metrics.length > 0
      ? metrics.reduce((sum, m) => sum + m.quality_score, 0) / metrics.length
      : 0;

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Source Quality Metrics</h1>
        <p className="mt-1 text-gray-600">
          Monitor and compare quality metrics across all job sources.
        </p>
      </div>

      {/* Overall Stats */}
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <StatCard
          title="Average Quality Score"
          value={`${Math.round(avgQualityScore * 100)}%`}
          subtitle="Across all sources"
        />
        <StatCard
          title="Active Sources"
          value={metrics.length.toString()}
          subtitle="Currently active"
        />
        <StatCard
          title="Total Jobs"
          value={metrics.reduce((sum, m) => sum + m.jobs_total, 0).toLocaleString()}
          subtitle="All sources combined"
        />
        <StatCard
          title="Avg Match Rate"
          value={`${Math.round(
            (metrics.reduce((sum, m) => sum + m.match_rate, 0) / metrics.length || 0) * 100
          )}%`}
          subtitle="Company matching success"
        />
      </div>

      {/* Source Comparison Table */}
      <Card>
        <CardContent className="pt-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Source Comparison</h2>
          {metrics.length === 0 ? (
            <p className="text-gray-500">No active sources to display.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Source
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Quality Score
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Total Jobs
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Match Rate
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Import Rate
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Completeness
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Error Rate
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Last 30 Days
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {metrics.map((metric) => (
                    <tr key={metric.source_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {metric.source_name}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${getQualityColor(metric.quality_score)}`}>
                            {Math.round(metric.quality_score * 100)}%
                          </span>
                          {getQualityBadge(metric.quality_score)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {metric.jobs_total.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {Math.round(metric.match_rate * 100)}%
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {Math.round(metric.import_rate * 100)}%
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {Math.round(metric.avg_completeness * 100)}%
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {Math.round(metric.error_rate * 100)}%
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <div className="space-y-1">
                          <div>Found: {metric.last_30_days.jobs_found}</div>
                          <div>New: {metric.last_30_days.jobs_new}</div>
                          <div>Dups: {metric.last_30_days.jobs_duplicates}</div>
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

