import { Card, CardContent } from '@/components/ui/Card';
import { StatCard } from '@/components/admin/StatCard';
import {
  getOverviewStats,
  getTierUsage,
  getCompaniesAtLimit,
  getCacheStats,
  getRecentActivity,
} from './actions';

export const metadata = {
  title: 'AI Usage | Admin | FSG Talent Hub',
};

function formatCost(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function TierProgressBar({
  tier,
  used,
  limit,
  percentage,
}: {
  tier: string;
  used: number;
  limit: number;
  percentage: number;
}) {
  const tierLabels: Record<string, string> = {
    free: 'Free',
    starter: 'Starter',
    professional: 'Professional',
    enterprise: 'Enterprise',
  };

  const barColor =
    percentage >= 80 ? 'bg-red-500' : percentage >= 50 ? 'bg-yellow-500' : 'bg-blue-500';

  return (
    <div className="mb-4 last:mb-0">
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">
          {tierLabels[tier] || tier}
        </span>
        <span className="text-gray-500">
          {used} / {limit} ({percentage}%)
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full ${barColor} transition-all`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}

export default async function AIUsagePage() {
  const [overview, tierUsage, companiesAtLimit, cacheStats, recentActivity] =
    await Promise.all([
      getOverviewStats(),
      getTierUsage(),
      getCompaniesAtLimit(),
      getCacheStats(),
      getRecentActivity(),
    ]);

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">AI Usage Dashboard</h1>
        <p className="mt-1 text-gray-600">
          Monitor AI feature usage, costs, and rate limits.
        </p>
      </div>

      {/* Overview Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Requests Today"
          value={overview.totalRequests}
          subtitle="AI API calls"
        />
        <StatCard
          title="Cost Today"
          value={formatCost(overview.totalCostCents)}
          subtitle="Estimated spend"
        />
        <StatCard
          title="Cache Hit Rate"
          value={`${overview.cacheHitRate}%`}
          subtitle={`${overview.cacheHits} cache hits`}
        />
        <StatCard
          title="Active Users"
          value={overview.uniqueUsers}
          subtitle="Using AI features"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Usage by Tier */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="mb-6 text-lg font-semibold text-gray-900">
              Usage by Tier
            </h2>
            {tierUsage.length === 0 ? (
              <p className="text-sm text-gray-500">No usage data yet.</p>
            ) : (
              <div>
                {tierUsage.map((tier) => (
                  <TierProgressBar
                    key={tier.tier}
                    tier={tier.tier}
                    used={tier.used}
                    limit={tier.limit}
                    percentage={tier.percentage}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rate Limit Warnings */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Rate Limit Warnings
            </h2>
            {companiesAtLimit.length === 0 ? (
              <div className="rounded-lg bg-green-50 p-4">
                <p className="text-sm text-green-700">
                  No companies are approaching their rate limits.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {companiesAtLimit.map((company) => (
                  <div
                    key={company.id}
                    className="flex items-center justify-between rounded-lg bg-yellow-50 p-3"
                  >
                    <div>
                      <p className="font-medium text-yellow-800">
                        {company.name}
                      </p>
                      <p className="text-sm text-yellow-700">
                        {company.tier} tier
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-yellow-800">
                        {company.percentage}%
                      </p>
                      <p className="text-sm text-yellow-700">
                        {company.used}/{company.limit}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cache Performance */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Cache Performance
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <span className="text-gray-600">Total cached entries</span>
                <span className="font-medium text-gray-900">
                  {cacheStats.totalEntries}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <span className="text-gray-600">Cache hit rate</span>
                <span className="font-medium text-gray-900">
                  {overview.cacheHitRate}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Entries expiring today</span>
                <span className="font-medium text-gray-900">
                  {cacheStats.expiringToday}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Recent Activity
            </h2>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-gray-500">No activity yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase text-gray-500">
                      <th className="pb-2 pr-3">Time</th>
                      <th className="pb-2 pr-3">Company</th>
                      <th className="pb-2 pr-3">Feature</th>
                      <th className="pb-2 text-right">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentActivity.map((activity) => (
                      <tr key={activity.id} className="border-b border-gray-50">
                        <td className="py-2 pr-3 text-gray-600">
                          {formatTime(activity.created_at)}
                        </td>
                        <td className="py-2 pr-3 text-gray-900">
                          {activity.company_name || '—'}
                        </td>
                        <td className="py-2 pr-3">
                          <span className="inline-flex items-center gap-1">
                            {activity.feature}
                            {activity.cached && (
                              <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-700">
                                cached
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="py-2 text-right text-gray-600">
                          {formatCost(activity.cost_cents)}
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

      {/* Empty State Help */}
      {overview.totalRequests === 0 && (
        <Card className="mt-8">
          <CardContent className="py-8 text-center">
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              No AI usage data yet
            </h3>
            <p className="text-gray-600">
              AI usage will appear here once users start using AI-powered
              features like job description generation.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
