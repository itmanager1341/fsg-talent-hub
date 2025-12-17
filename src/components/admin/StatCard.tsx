import { Card, CardContent } from '@/components/ui/Card';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    label: string;
  };
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  className = '',
}: StatCardProps) {
  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
            {subtitle && (
              <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
            )}
            {trend && (
              <p
                className={`mt-1 text-sm ${
                  trend.value >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend.value >= 0 ? '+' : ''}
                {trend.value}% {trend.label}
              </p>
            )}
          </div>
          {icon && (
            <div className="rounded-lg bg-gray-50 p-2 text-gray-400">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
