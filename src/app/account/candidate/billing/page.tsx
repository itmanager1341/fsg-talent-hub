import Link from 'next/link';
import { requireCandidate } from '@/lib/auth/requireAuth';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/Card';
import { CheckoutButton } from './CheckoutButton';

export const metadata = {
  title: 'Billing | FSG Talent Hub',
  description: 'Manage your subscription and unlock premium features.',
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

interface Candidate {
  id: string;
  first_name: string | null;
  last_name: string | null;
  tier: string;
}

const tierFeatures: Record<string, string[]> = {
  free: [
    'Create your profile',
    'Upload resume',
    'Apply to unlimited jobs',
    'Save jobs for later',
    'Basic job alerts',
  ],
  premium: [
    'Everything in Free, plus:',
    'AI resume review & suggestions',
    'AI cover letter generator',
    'Enhanced job recommendations',
    'Priority application visibility',
    'Advanced job alerts',
    'Application tracking insights',
  ],
};

async function getCandidatePrices(): Promise<StripePrice[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('stripe_prices')
    .select('*')
    .eq('billing_type', 'candidate')
    .eq('is_active', true)
    .order('amount_cents', { ascending: true });

  if (error) {
    console.error('Error fetching prices:', error);
    return [];
  }

  return data || [];
}

async function getCandidateSubscription(
  candidateId: string
): Promise<Subscription | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('candidate_id', candidateId)
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

export default async function CandidateBillingPage({
  searchParams,
}: {
  searchParams: Promise<{ subscription?: string }>;
}) {
  const params = await searchParams;
  const { candidate } = await requireCandidate();
  const typedCandidate = candidate as Candidate;

  const [prices, subscription] = await Promise.all([
    getCandidatePrices(),
    getCandidateSubscription(typedCandidate.id),
  ]);

  const currentTier = typedCandidate.tier || 'free';
  const premiumPrice = prices.find((p) => p.tier === 'premium');

  return (
    <div className="bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/account/candidate"
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            &larr; Back to Dashboard
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            Billing & Subscription
          </h1>
          <p className="mt-1 text-gray-600">
            Manage your subscription and unlock premium features
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
                Welcome to Premium! Your enhanced features are now active.
              </p>
            </CardContent>
          </Card>
        )}

        {params.subscription === 'canceled' && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <h3 className="font-medium text-yellow-800">Checkout canceled</h3>
              <p className="text-sm text-yellow-700">
                Your checkout was canceled. You can upgrade whenever
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
                {subscription && subscription.status === 'active' && (
                  <p className="mt-1 text-sm text-gray-500">
                    Renews on {formatDate(subscription.current_period_end)}
                  </p>
                )}
                {!subscription && currentTier === 'free' && (
                  <p className="mt-1 text-sm text-gray-500">
                    Upgrade to unlock premium features
                  </p>
                )}
              </div>
              <div className="rounded-lg bg-gray-100 px-4 py-2">
                <p className="text-sm text-gray-500">Price</p>
                <p className="text-xl font-bold text-gray-900">
                  {currentTier === 'free' ? 'Free' : `${formatPrice(premiumPrice?.amount_cents || 1900)}/mo`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Plans */}
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Available Plans
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Free Tier */}
          <Card className={currentTier === 'free' ? 'border-2 border-blue-500' : ''}>
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

          {/* Premium Tier */}
          {premiumPrice && (
            <Card
              className={
                currentTier === 'premium'
                  ? 'border-2 border-blue-500'
                  : 'border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white'
              }
            >
              <CardContent className="pt-6">
                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Premium
                    </h3>
                    <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700">
                      Recommended
                    </span>
                  </div>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {formatPrice(premiumPrice.amount_cents)}
                  </p>
                  <p className="text-sm text-gray-500">per month</p>
                </div>
                <ul className="mb-6 space-y-2">
                  {tierFeatures.premium.map((feature) => (
                    <li
                      key={feature}
                      className={`flex items-start text-sm ${
                        feature.startsWith('Everything')
                          ? 'font-medium text-gray-700'
                          : 'text-gray-600'
                      }`}
                    >
                      {!feature.startsWith('Everything') && (
                        <span className="mr-2 text-purple-500">&#10003;</span>
                      )}
                      {feature}
                    </li>
                  ))}
                </ul>
                <CheckoutButton
                  priceId={premiumPrice.stripe_price_id}
                  tierName="Premium"
                  isCurrentPlan={currentTier === 'premium'}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* FAQ Section */}
        <Card className="mt-8">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-gray-900">
              Frequently Asked Questions
            </h3>
            <div className="mt-4 space-y-4">
              <div>
                <p className="font-medium text-gray-700">
                  Can I cancel anytime?
                </p>
                <p className="text-sm text-gray-600">
                  Yes, you can cancel your subscription at any time. You&apos;ll
                  continue to have access until the end of your billing period.
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-700">
                  What payment methods do you accept?
                </p>
                <p className="text-sm text-gray-600">
                  We accept all major credit cards through Stripe&apos;s secure
                  payment platform.
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Need help?</p>
                <p className="text-sm text-gray-600">
                  Contact our support team at{' '}
                  <a
                    href="mailto:support@fsgmedia.com"
                    className="text-blue-600 hover:text-blue-500"
                  >
                    support@fsgmedia.com
                  </a>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
