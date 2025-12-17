import Link from 'next/link';
import { requireEmployer } from '@/lib/auth/requireAuth';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/Card';
import { CheckoutButton } from './CheckoutButton';

export const metadata = {
  title: 'Billing | FSG Talent Hub',
  description: 'Manage your subscription and billing.',
};

interface StripePrice {
  id: string;
  stripe_price_id: string;
  tier: string;
  billing_type: string;
  amount_cents: number;
  is_active: boolean;
}

interface Subscription {
  id: string;
  tier: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
}

interface Company {
  id: string;
  name: string;
  tier: string;
}

const tierFeatures: Record<string, string[]> = {
  free: [
    '1 active job posting',
    'Basic company profile',
    'View applications',
    'Email notifications',
  ],
  starter: [
    '5 active job postings',
    'Enhanced company profile',
    'AI job description generator (50/day)',
    'View applications',
    'Email notifications',
    'Basic analytics',
  ],
  professional: [
    '25 active job postings',
    'Premium company profile',
    'AI job description generator (200/day)',
    'Featured job listings',
    'Advanced analytics',
    'Priority support',
    'Resume search (limited)',
  ],
  enterprise: [
    'Unlimited job postings',
    'Premium company profile',
    'AI job description generator (1000/day)',
    'Featured job listings',
    'Full analytics dashboard',
    'Dedicated support',
    'Full resume database access',
    'API access',
  ],
};

const tierOrder = ['free', 'starter', 'professional', 'enterprise'];

async function getEmployerPrices(): Promise<StripePrice[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('stripe_prices')
    .select('*')
    .eq('billing_type', 'employer')
    .eq('is_active', true)
    .order('amount_cents', { ascending: true });

  if (error) {
    console.error('Error fetching prices:', error);
    return [];
  }

  return data || [];
}

async function getCompanySubscription(
  companyId: string
): Promise<Subscription | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('company_id', companyId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }

  return data;
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default async function EmployerBillingPage({
  searchParams,
}: {
  searchParams: Promise<{ subscription?: string }>;
}) {
  const params = await searchParams;
  const { companyUser } = await requireEmployer();
  const company = (
    Array.isArray(companyUser.company)
      ? companyUser.company[0]
      : companyUser.company
  ) as Company;

  const [prices, subscription] = await Promise.all([
    getEmployerPrices(),
    getCompanySubscription(company.id),
  ]);

  const currentTier = company.tier || 'free';
  const currentTierIndex = tierOrder.indexOf(currentTier);

  return (
    <div className="bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/employers/dashboard"
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            &larr; Back to Dashboard
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            Billing & Subscription
          </h1>
          <p className="mt-1 text-gray-600">
            Manage your subscription plan for {company.name}
          </p>
        </div>

        {/* Success/Cancel Messages */}
        {params.subscription === 'success' && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <h3 className="font-medium text-green-800">
                Subscription successful!
              </h3>
              <p className="text-sm text-green-700">
                Your subscription has been activated. It may take a moment to
                reflect in your account.
              </p>
            </CardContent>
          </Card>
        )}

        {params.subscription === 'canceled' && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <h3 className="font-medium text-yellow-800">
                Checkout canceled
              </h3>
              <p className="text-sm text-yellow-700">
                Your checkout was canceled. You can try again whenever
                you&apos;re ready.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Current Plan */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Current Plan
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold capitalize text-gray-900">
                  {currentTier}
                </p>
                {subscription && (
                  <p className="mt-1 text-sm text-gray-500">
                    {subscription.status === 'active' ? (
                      <>
                        Renews on {formatDate(subscription.current_period_end)}
                      </>
                    ) : (
                      <>Status: {subscription.status}</>
                    )}
                  </p>
                )}
                {!subscription && currentTier === 'free' && (
                  <p className="mt-1 text-sm text-gray-500">
                    No active subscription
                  </p>
                )}
              </div>
              <div className="rounded-lg bg-gray-100 px-4 py-2">
                <p className="text-sm text-gray-500">Price</p>
                <p className="text-xl font-bold text-gray-900">
                  {currentTier === 'free'
                    ? 'Free'
                    : `${formatPrice(prices.find((p) => p.tier === currentTier)?.amount_cents || 0)}/mo`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Plans */}
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Available Plans
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Free Tier */}
          <Card
            className={
              currentTier === 'free' ? 'border-2 border-blue-500' : ''
            }
          >
            <CardContent className="pt-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Free</h3>
                <p className="mt-2 text-3xl font-bold text-gray-900">$0</p>
                <p className="text-sm text-gray-500">Forever free</p>
              </div>
              <ul className="mb-6 space-y-2">
                {tierFeatures.free.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start text-sm text-gray-600"
                  >
                    <span className="mr-2 text-green-500">&#10003;</span>
                    {feature}
                  </li>
                ))}
              </ul>
              {currentTier === 'free' ? (
                <div className="rounded-lg bg-blue-50 px-4 py-2 text-center text-sm font-medium text-blue-700">
                  Current Plan
                </div>
              ) : (
                <div className="text-center text-sm text-gray-500">
                  Base tier
                </div>
              )}
            </CardContent>
          </Card>

          {/* Paid Tiers */}
          {prices.map((price) => {
            const tierIndex = tierOrder.indexOf(price.tier);
            const isCurrentPlan = price.tier === currentTier;
            const isDowngrade = tierIndex < currentTierIndex;

            return (
              <Card
                key={price.id}
                className={isCurrentPlan ? 'border-2 border-blue-500' : ''}
              >
                <CardContent className="pt-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold capitalize text-gray-900">
                      {price.tier}
                    </h3>
                    <p className="mt-2 text-3xl font-bold text-gray-900">
                      {formatPrice(price.amount_cents)}
                    </p>
                    <p className="text-sm text-gray-500">per month</p>
                  </div>
                  <ul className="mb-6 space-y-2">
                    {(tierFeatures[price.tier] || []).map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start text-sm text-gray-600"
                      >
                        <span className="mr-2 text-green-500">&#10003;</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  {isDowngrade ? (
                    <div className="text-center text-sm text-gray-500">
                      Contact support to downgrade
                    </div>
                  ) : (
                    <CheckoutButton
                      priceId={price.stripe_price_id}
                      tierName={price.tier}
                      currentTier={currentTier}
                    />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Help Section */}
        <Card className="mt-8">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-gray-900">Need help?</h3>
            <p className="mt-2 text-sm text-gray-600">
              Contact our support team at{' '}
              <a
                href="mailto:support@fsgmedia.com"
                className="text-blue-600 hover:text-blue-500"
              >
                support@fsgmedia.com
              </a>{' '}
              for billing questions or to manage your subscription.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
