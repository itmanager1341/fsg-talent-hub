'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { createCompany } from './actions';

const industryOptions = [
  { value: '', label: 'Select industry' },
  { value: 'mortgage_servicing', label: 'Mortgage Servicing' },
  { value: 'financial_services', label: 'Financial Services' },
  { value: 'mna_advisory', label: 'M&A Advisory' },
  { value: 'banking', label: 'Banking' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'technology', label: 'Technology' },
  { value: 'other', label: 'Other' },
];

const companySizeOptions = [
  { value: '', label: 'Select company size' },
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '500+', label: '500+ employees' },
];

const stateOptions = [
  { value: '', label: 'Select state' },
  { value: 'TX', label: 'Texas' },
  { value: 'CA', label: 'California' },
  { value: 'NY', label: 'New York' },
  { value: 'FL', label: 'Florida' },
  { value: 'IL', label: 'Illinois' },
  { value: 'GA', label: 'Georgia' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'OH', label: 'Ohio' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'MI', label: 'Michigan' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'CO', label: 'Colorado' },
  { value: 'OTHER', label: 'Other' },
];

interface CompanySetupFormProps {
  userEmail: string;
}

export function CompanySetupForm({ userEmail }: CompanySetupFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    const result = await createCompany(formData);

    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
    } else {
      // Refresh to ensure role is recognized before redirecting
      router.refresh();
      router.push('/employers/dashboard');
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="mb-6">
        <CardContent className="space-y-4 pt-6">
          <h2 className="font-semibold text-gray-900">Company Information</h2>

          <Input
            name="name"
            label="Company Name"
            placeholder="Acme Financial Services"
            required
          />

          <Input
            name="website"
            label="Website"
            type="url"
            placeholder="https://www.example.com"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              name="industry"
              label="Industry"
              options={industryOptions}
              defaultValue=""
            />
            <Select
              name="company_size"
              label="Company Size"
              options={companySizeOptions}
              defaultValue=""
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Company Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              placeholder="Tell candidates about your company, culture, and what makes it a great place to work..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent className="space-y-4 pt-6">
          <h2 className="font-semibold text-gray-900">Headquarters Location</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              name="headquarters_city"
              label="City"
              placeholder="Dallas"
            />
            <Select
              name="headquarters_state"
              label="State"
              options={stateOptions}
              defaultValue=""
            />
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent className="space-y-4 pt-6">
          <h2 className="font-semibold text-gray-900">Your Role</h2>
          <p className="text-sm text-gray-600">
            You&apos;ll be set up as the company owner with full access to
            manage jobs, view applications, and invite team members.
          </p>
          <Input
            name="user_email"
            label="Your Email"
            type="email"
            defaultValue={userEmail}
            disabled
          />
        </CardContent>
      </Card>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex gap-4">
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? 'Creating Company...' : 'Create Company'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
