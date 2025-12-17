import { createClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/Card';
import { FeatureFlagToggle } from './FeatureFlagToggle';

export const metadata = {
  title: 'Settings | Admin | FSG Talent Hub',
};

interface FeatureFlag {
  id: string;
  key: string;
  description: string | null;
  enabled: boolean;
  config: Record<string, unknown>;
  updated_at: string;
}

async function getFeatureFlags(): Promise<FeatureFlag[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('feature_flags')
    .select('*')
    .order('key');

  if (error) {
    console.error('Error fetching feature flags:', error);
    return [];
  }

  return data || [];
}

const flagDescriptions: Record<string, { title: string; help: string }> = {
  employer_browse_all_candidates: {
    title: 'Employer Candidate Browse',
    help: 'When enabled, employers can browse all active candidates. When disabled, employers can only see searchable candidates and their own applicants.',
  },
};

const tierOptions = [
  { value: 'free', label: 'Free (all employers)' },
  { value: 'standard', label: 'Standard+ (paid only)' },
  { value: 'premium', label: 'Premium only' },
];

export default async function AdminSettingsPage() {
  const flags = await getFeatureFlags();

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-gray-600">
          Manage feature flags and platform configuration.
        </p>
      </div>

      {/* Content */}
      <div className="max-w-4xl">
        <Card>
          <CardContent className="pt-6">
            <h2 className="mb-6 text-lg font-semibold text-gray-900">
              Feature Flags
            </h2>

            {flags.length === 0 ? (
              <p className="text-gray-500">No feature flags configured.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {flags.map((flag) => {
                  const meta = flagDescriptions[flag.key] || {
                    title: flag.key,
                    help: flag.description || 'No description available.',
                  };

                  return (
                    <div key={flag.id} className="py-6 first:pt-0 last:pb-0">
                      <FeatureFlagToggle
                        flag={flag}
                        title={meta.title}
                        help={meta.help}
                        tierOptions={tierOptions}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documentation */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              How Feature Flags Work
            </h2>
            <div className="prose prose-sm text-gray-600">
              <p>
                Feature flags control platform behavior at the database level
                via RLS policies. Changes take effect immediately.
              </p>
              <h3 className="mt-4 text-sm font-medium text-gray-900">
                Employer Candidate Browse
              </h3>
              <ul className="mt-2 list-disc pl-5 text-sm">
                <li>
                  <strong>Enabled:</strong> All employers can browse the full
                  candidate database (subject to tier restrictions).
                </li>
                <li>
                  <strong>Disabled:</strong> Employers can only see candidates
                  who have applied to their jobs, plus candidates who opted into
                  search visibility.
                </li>
                <li>
                  <strong>Tier restriction:</strong> When set to
                  &quot;Standard+&quot; or &quot;Premium&quot;, only employers
                  on those tiers can browse all candidates.
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
