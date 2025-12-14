'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { updateProfile } from './actions';

interface Candidate {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  headline: string | null;
  summary: string | null;
  city: string | null;
  state: string | null;
  willing_to_relocate: boolean;
  desired_work_settings: string[] | null;
  desired_job_types: string[] | null;
  desired_salary_min: number | null;
  is_searchable: boolean;
}

interface ProfileFormProps {
  candidate: Candidate;
}

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

export function ProfileForm({ candidate }: ProfileFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedWorkSettings, setSelectedWorkSettings] = useState<string[]>(
    candidate.desired_work_settings || []
  );
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>(
    candidate.desired_job_types || []
  );

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
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    formData.set('candidateId', candidate.id);
    formData.set('desired_work_settings', JSON.stringify(selectedWorkSettings));
    formData.set('desired_job_types', JSON.stringify(selectedJobTypes));

    const result = await updateProfile(formData);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      router.refresh();
    }

    setIsSubmitting(false);
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
              defaultValue={candidate.first_name || ''}
              required
            />
            <Input
              name="last_name"
              label="Last Name"
              defaultValue={candidate.last_name || ''}
              required
            />
          </div>

          <Input
            name="email"
            label="Email"
            type="email"
            defaultValue={candidate.email}
            required
          />

          <Input
            name="phone"
            label="Phone Number"
            type="tel"
            defaultValue={candidate.phone || ''}
          />

          <Input
            name="headline"
            label="Professional Headline"
            defaultValue={candidate.headline || ''}
            placeholder="Senior Mortgage Analyst with 10+ years experience"
          />
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent className="space-y-4 pt-6">
          <h2 className="font-semibold text-gray-900">Location</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              name="city"
              label="City"
              defaultValue={candidate.city || ''}
            />
            <Select
              name="state"
              label="State"
              options={stateOptions}
              defaultValue={candidate.state || ''}
            />
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="willing_to_relocate"
              value="true"
              defaultChecked={candidate.willing_to_relocate}
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
            defaultValue={candidate.desired_salary_min || ''}
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
              defaultValue={candidate.summary || ''}
              placeholder="Tell employers about your experience, skills, and career goals..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent className="space-y-4 pt-6">
          <h2 className="font-semibold text-gray-900">Privacy Settings</h2>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="is_searchable"
              value="true"
              defaultChecked={candidate.is_searchable}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              Allow employers to find my profile in candidate search
            </span>
          </label>
        </CardContent>
      </Card>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-600">
          Profile updated successfully!
        </div>
      )}

      <div className="flex gap-4">
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => router.push('/account/candidate')}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
