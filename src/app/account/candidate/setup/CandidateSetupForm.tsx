'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { createCandidate } from './actions';

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

const workSettingOptions = [
  { value: 'onsite', label: 'On-site' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
];

const jobTypeOptions = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
];

interface CandidateSetupFormProps {
  userEmail: string;
}

export function CandidateSetupForm({ userEmail }: CandidateSetupFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedWorkSettings, setSelectedWorkSettings] = useState<string[]>([]);
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>([]);

  const toggleWorkSetting = (value: string) => {
    setSelectedWorkSettings((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    );
  };

  const toggleJobType = (value: string) => {
    setSelectedJobTypes((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    );
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set('desired_work_settings', JSON.stringify(selectedWorkSettings));
    formData.set('desired_job_types', JSON.stringify(selectedJobTypes));

    const result = await createCandidate(formData);

    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
    } else {
      router.push('/account/candidate');
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="mb-6">
        <CardContent className="space-y-4 pt-6">
          <h2 className="font-semibold text-gray-900">Basic Information</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              name="first_name"
              label="First Name"
              placeholder="John"
              required
            />
            <Input
              name="last_name"
              label="Last Name"
              placeholder="Smith"
              required
            />
          </div>

          <Input
            name="email"
            label="Email"
            type="email"
            defaultValue={userEmail}
            required
          />

          <Input
            name="phone"
            label="Phone Number"
            type="tel"
            placeholder="(555) 123-4567"
          />

          <Input
            name="headline"
            label="Professional Headline"
            placeholder="Senior Mortgage Analyst with 10+ years experience"
          />
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent className="space-y-4 pt-6">
          <h2 className="font-semibold text-gray-900">Location</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input name="city" label="City" placeholder="Dallas" />
            <Select
              name="state"
              label="State"
              options={stateOptions}
              defaultValue=""
            />
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="willing_to_relocate"
              value="true"
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              I&apos;m willing to relocate for the right opportunity
            </span>
          </label>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent className="space-y-4 pt-6">
          <h2 className="font-semibold text-gray-900">Job Preferences</h2>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Preferred Work Setting
            </label>
            <div className="flex flex-wrap gap-2">
              {workSettingOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleWorkSetting(option.value)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                    selectedWorkSettings.includes(option.value)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Preferred Job Type
            </label>
            <div className="flex flex-wrap gap-2">
              {jobTypeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleJobType(option.value)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                    selectedJobTypes.includes(option.value)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <Input
            name="desired_salary_min"
            label="Desired Minimum Salary"
            type="number"
            placeholder="75000"
            min={0}
          />
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent className="space-y-4 pt-6">
          <h2 className="font-semibold text-gray-900">About You</h2>
          <div>
            <label
              htmlFor="summary"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Professional Summary
            </label>
            <textarea
              id="summary"
              name="summary"
              rows={4}
              placeholder="Tell employers about your experience, skills, and career goals..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex gap-4">
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? 'Creating Profile...' : 'Create Profile'}
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
