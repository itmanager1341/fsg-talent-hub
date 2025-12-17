'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { createJob, updateJob } from '../actions';
import { supabase } from '@/lib/supabaseClient';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string | null;
  benefits: string | null;
  department: string | null;
  job_type: string;
  experience_level: string | null;
  work_setting: string;
  location_city: string | null;
  location_state: string | null;
  salary_min: number | null;
  salary_max: number | null;
  show_salary: boolean;
  status: string;
}

interface JobFormProps {
  companyId: string;
  companyName: string;
  job?: Job;
}

const jobTypeOptions = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
  { value: 'temporary', label: 'Temporary' },
];

const experienceLevelOptions = [
  { value: '', label: 'Select experience level' },
  { value: 'entry', label: 'Entry Level' },
  { value: 'mid', label: 'Mid Level' },
  { value: 'senior', label: 'Senior Level' },
  { value: 'lead', label: 'Lead' },
  { value: 'executive', label: 'Executive' },
];

const workSettingOptions = [
  { value: 'onsite', label: 'On-site' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
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
];

export function JobForm({ companyId, companyName, job }: JobFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSalary, setShowSalary] = useState(job?.show_salary ?? true);
  const [isGeneratingJD, setIsGeneratingJD] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const isEditing = !!job;

  async function handleGenerateJD() {
    setIsGeneratingJD(true);
    setAiError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setAiError('Please sign in to use AI generation');
        return;
      }

      // Get form values
      const formData = formRef.current ? new FormData(formRef.current) : null;
      const jobTitle = formData?.get('title') as string;
      const experienceLevel = formData?.get('experience_level') as string;
      const workSetting = formData?.get('work_setting') as string;
      const department = formData?.get('department') as string;

      if (!jobTitle || jobTitle.length < 3) {
        setAiError('Please enter a job title first');
        return;
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-jd`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_title: jobTitle,
          seniority: experienceLevel || undefined,
          work_setting: workSetting || undefined,
          industry: department || undefined,
          company_description: companyName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setAiError(
            `Daily AI limit reached (${data.used}/${data.limit}). Upgrade your plan for more.`
          );
        } else {
          setAiError(data.error || 'Failed to generate description');
        }
        return;
      }

      // Update the textarea
      if (descriptionRef.current && data.job_description) {
        descriptionRef.current.value = data.job_description;
      }
    } catch (err) {
      console.error('AI generation error:', err);
      setAiError('Failed to connect to AI service');
    } finally {
      setIsGeneratingJD(false);
    }
  }

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>,
    status: 'draft' | 'active'
  ) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set('company_id', companyId);
    formData.set('status', status);
    formData.set('show_salary', showSalary ? 'true' : 'false');

    const result = isEditing
      ? await updateJob(job.id, formData)
      : await createJob(formData);

    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
    } else {
      router.push('/employers/dashboard');
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        // Default to draft, buttons will override
      }}
    >
      <Card className="mb-6">
        <CardContent className="space-y-4 pt-6">
          <h2 className="font-semibold text-gray-900">Job Details</h2>

          <Input
            name="title"
            label="Job Title"
            placeholder="Senior Mortgage Analyst"
            defaultValue={job?.title || ''}
            required
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              name="job_type"
              label="Job Type"
              options={jobTypeOptions}
              defaultValue={job?.job_type || 'full_time'}
            />
            <Select
              name="experience_level"
              label="Experience Level"
              options={experienceLevelOptions}
              defaultValue={job?.experience_level || ''}
            />
          </div>

          <Input
            name="department"
            label="Department"
            placeholder="Operations"
            defaultValue={job?.department || ''}
          />

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                Job Description <span className="text-red-500">*</span>
              </label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleGenerateJD}
                disabled={isGeneratingJD}
                className="text-blue-600 hover:text-blue-700"
              >
                {isGeneratingJD ? 'Generating...' : 'Generate with AI'}
              </Button>
            </div>
            {aiError && (
              <p className="mb-2 text-sm text-red-600">{aiError}</p>
            )}
            <textarea
              ref={descriptionRef}
              id="description"
              name="description"
              rows={8}
              required
              defaultValue={job?.description || ''}
              placeholder="Describe the role, responsibilities, and what a typical day looks like..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Tip: Fill in the job title, experience level, and work setting above, then click &quot;Generate with AI&quot; for a professional description.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent className="space-y-4 pt-6">
          <h2 className="font-semibold text-gray-900">Requirements & Benefits</h2>

          <div>
            <label
              htmlFor="requirements"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Requirements
            </label>
            <textarea
              id="requirements"
              name="requirements"
              rows={4}
              defaultValue={job?.requirements || ''}
              placeholder="• 5+ years of experience in mortgage servicing&#10;• Bachelor's degree in Finance or related field&#10;• Strong analytical skills"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="benefits"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Benefits
            </label>
            <textarea
              id="benefits"
              name="benefits"
              rows={4}
              defaultValue={job?.benefits || ''}
              placeholder="• Competitive salary and bonus&#10;• Health, dental, and vision insurance&#10;• 401(k) with company match&#10;• Flexible work arrangements"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent className="space-y-4 pt-6">
          <h2 className="font-semibold text-gray-900">Location</h2>

          <Select
            name="work_setting"
            label="Work Setting"
            options={workSettingOptions}
            defaultValue={job?.work_setting || 'onsite'}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              name="location_city"
              label="City"
              placeholder="Dallas"
              defaultValue={job?.location_city || ''}
            />
            <Select
              name="location_state"
              label="State"
              options={stateOptions}
              defaultValue={job?.location_state || ''}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent className="space-y-4 pt-6">
          <h2 className="font-semibold text-gray-900">Compensation</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              name="salary_min"
              label="Minimum Salary"
              type="number"
              placeholder="75000"
              defaultValue={job?.salary_min || ''}
              min={0}
            />
            <Input
              name="salary_max"
              label="Maximum Salary"
              type="number"
              placeholder="95000"
              defaultValue={job?.salary_max || ''}
              min={0}
            />
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showSalary}
              onChange={(e) => setShowSalary(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              Display salary range on job posting
            </span>
          </label>
          <p className="text-xs text-gray-500">
            Jobs with salary information receive 30% more applications on
            average.
          </p>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <h2 className="mb-2 font-semibold text-gray-900">Posting as</h2>
          <p className="text-gray-600">{companyName}</p>
        </CardContent>
      </Card>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex gap-4">
        <Button
          type="button"
          size="lg"
          disabled={isSubmitting}
          onClick={(e) => {
            const form = (e.target as HTMLElement).closest('form');
            if (form) {
              const fakeEvent = {
                preventDefault: () => {},
                currentTarget: form,
              } as React.FormEvent<HTMLFormElement>;
              handleSubmit(fakeEvent, 'active');
            }
          }}
        >
          {isSubmitting ? 'Publishing...' : isEditing ? 'Update & Publish' : 'Publish Job'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={isSubmitting}
          onClick={(e) => {
            const form = (e.target as HTMLElement).closest('form');
            if (form) {
              const fakeEvent = {
                preventDefault: () => {},
                currentTarget: form,
              } as React.FormEvent<HTMLFormElement>;
              handleSubmit(fakeEvent, 'draft');
            }
          }}
        >
          {isEditing ? 'Save as Draft' : 'Save Draft'}
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
