'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateFeatureFlag } from './actions';

interface FeatureFlag {
  id: string;
  key: string;
  enabled: boolean;
  config: Record<string, unknown>;
  updated_at: string;
}

interface TierOption {
  value: string;
  label: string;
}

interface FeatureFlagToggleProps {
  flag: FeatureFlag;
  title: string;
  help: string;
  tierOptions: TierOption[];
}

export function FeatureFlagToggle({
  flag,
  title,
  help,
  tierOptions,
}: FeatureFlagToggleProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const currentTier =
    (flag.config?.min_company_tier as string) || 'free';

  const handleToggle = () => {
    setError(null);
    startTransition(async () => {
      const result = await updateFeatureFlag(flag.id, {
        enabled: !flag.enabled,
      });
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  };

  const handleTierChange = (newTier: string) => {
    setError(null);
    startTransition(async () => {
      const result = await updateFeatureFlag(flag.id, {
        config: { ...flag.config, min_company_tier: newTier },
      });
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  };

  const lastUpdated = new Date(flag.updated_at).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="font-medium text-gray-900">{title}</h3>
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                flag.enabled
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {flag.enabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">{help}</p>
          <p className="mt-2 text-xs text-gray-400">
            Key: <code className="rounded bg-gray-100 px-1">{flag.key}</code>
            {' · '}Last updated: {lastUpdated}
          </p>
        </div>

        <button
          type="button"
          onClick={handleToggle}
          disabled={isPending}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${
            flag.enabled ? 'bg-blue-600' : 'bg-gray-200'
          }`}
          role="switch"
          aria-checked={flag.enabled}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              flag.enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Tier selector (only show if flag has min_company_tier config) */}
      {flag.config?.min_company_tier !== undefined && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">
            Minimum Tier Required
          </label>
          <select
            value={currentTier}
            onChange={(e) => handleTierChange(e.target.value)}
            disabled={isPending || !flag.enabled}
            className="mt-1 block w-full max-w-xs rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
          >
            {tierOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {!flag.enabled && (
            <p className="mt-1 text-xs text-gray-400">
              Enable the flag to change tier requirements.
            </p>
          )}
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
