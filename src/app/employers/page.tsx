import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

export const metadata = {
  title: 'For Employers | FSG Talent Hub',
  description:
    'Post jobs and find top talent in mortgage servicing, M&A advisory, and financial services.',
};

const features = [
  {
    title: 'Quality Applicants',
    description:
      'Reach candidates with specialized experience in financial services, mortgage servicing, and M&A advisory.',
  },
  {
    title: 'AI-Powered Matching',
    description:
      'Our intelligent matching system helps surface the most qualified candidates for your open positions.',
  },
  {
    title: 'Streamlined Hiring',
    description:
      'Manage job postings, review applications, and track candidates all in one platform.',
  },
  {
    title: 'Industry Network',
    description:
      'Access talent from FSI, AM&AA, and partner association networks across financial services.',
  },
];

const pricingTiers = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Get started with basic job posting',
    features: [
      '1 active job posting',
      'Basic company profile',
      'Applicant inbox',
      'Email notifications',
    ],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Standard',
    price: '$249',
    period: 'per month',
    description: 'For growing teams with multiple openings',
    features: [
      '5 active job postings',
      'AI job description generator',
      'Featured job placement',
      'Resume database (limited)',
      'Priority support',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Premium',
    price: '$599',
    period: 'per month',
    description: 'For enterprise recruiting needs',
    features: [
      'Unlimited job postings',
      'AI applicant ranking',
      'Full resume database access',
      'Newsletter sponsorship',
      'Dedicated account manager',
      'Custom integrations',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

export default function EmployersPage() {
  return (
    <div className="bg-gray-50">
      {/* Hero */}
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">
            Find Top Talent in Financial Services
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-600">
            Post jobs and connect with qualified candidates in mortgage
            servicing, M&A advisory, and financial services.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/signup/employer">
              <Button size="lg">Post a Job</Button>
            </Link>
            <Link href="#pricing">
              <Button variant="outline" size="lg">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
          Why Hire on FSG Talent Hub?
        </h2>
        <div className="grid gap-8 md:grid-cols-2">
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardContent className="pt-6">
                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="mb-4 text-center text-3xl font-bold text-gray-900">
            Simple, Transparent Pricing
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-center text-gray-600">
            Choose the plan that fits your hiring needs. All plans include core
            features with no hidden fees.
          </p>

          <div className="grid gap-8 md:grid-cols-3">
            {pricingTiers.map((tier) => (
              <Card
                key={tier.name}
                className={
                  tier.highlighted ? 'border-2 border-blue-500 shadow-lg' : ''
                }
              >
                <CardContent className="pt-6">
                  {tier.highlighted && (
                    <span className="mb-4 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                      Most Popular
                    </span>
                  )}
                  <h3 className="text-xl font-bold text-gray-900">
                    {tier.name}
                  </h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-gray-900">
                      {tier.price}
                    </span>
                    <span className="text-gray-500"> {tier.period}</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{tier.description}</p>

                  <ul className="mt-6 space-y-3">
                    {tier.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm text-gray-600"
                      >
                        <svg
                          className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8">
                    <Link href="/signup/employer">
                      <Button
                        className="w-full"
                        variant={tier.highlighted ? 'primary' : 'outline'}
                      >
                        {tier.cta}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="mt-8 text-center text-sm text-gray-500">
            Association members receive discounts based on membership level.{' '}
            <Link href="/signin" className="text-blue-600 hover:text-blue-500">
              Sign in to see your pricing
            </Link>
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">
            Ready to find your next hire?
          </h2>
          <p className="mb-8 text-gray-600">
            Join hundreds of companies already hiring on FSG Talent Hub.
          </p>
          <Link href="/signup/employer">
            <Button size="lg">Get Started Free</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
