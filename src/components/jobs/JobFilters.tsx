'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

const locationOptions = [
  { value: '', label: 'All Locations' },
  { value: 'remote', label: 'Remote' },
  { value: 'TX', label: 'Texas' },
  { value: 'CA', label: 'California' },
  { value: 'NY', label: 'New York' },
  { value: 'FL', label: 'Florida' },
  { value: 'IL', label: 'Illinois' },
  { value: 'GA', label: 'Georgia' },
];

const workSettingOptions = [
  { value: '', label: 'All Work Settings' },
  { value: 'onsite', label: 'On-site' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
];

const jobTypeOptions = [
  { value: '', label: 'All Job Types' },
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
  { value: 'temporary', label: 'Temporary' },
];

const experienceLevelOptions = [
  { value: '', label: 'All Experience Levels' },
  { value: 'entry', label: 'Entry Level' },
  { value: 'mid', label: 'Mid Level' },
  { value: 'senior', label: 'Senior Level' },
  { value: 'lead', label: 'Lead' },
  { value: 'executive', label: 'Executive' },
];

export function JobFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });

      // Reset to page 1 when filters change
      params.delete('page');

      return params.toString();
    },
    [searchParams]
  );

  const handleFilterChange = (key: string, value: string) => {
    const queryString = createQueryString({ [key]: value });
    router.push(`/jobs?${queryString}`);
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = formData.get('q') as string;
    const queryString = createQueryString({ q });
    router.push(`/jobs?${queryString}`);
  };

  const handleClearFilters = () => {
    router.push('/jobs');
  };

  const hasFilters =
    searchParams.get('q') ||
    searchParams.get('location') ||
    searchParams.get('work_setting') ||
    searchParams.get('job_type') ||
    searchParams.get('experience');

  return (
    <div className="space-y-4">
      {/* Search */}
      <form onSubmit={handleSearch}>
        <div className="flex gap-2">
          <Input
            name="q"
            placeholder="Search job titles, keywords..."
            defaultValue={searchParams.get('q') || ''}
          />
          <Button type="submit">Search</Button>
        </div>
      </form>

      {/* Filters */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Select
          options={locationOptions}
          value={searchParams.get('location') || ''}
          onChange={(e) => handleFilterChange('location', e.target.value)}
          aria-label="Location"
        />
        <Select
          options={workSettingOptions}
          value={searchParams.get('work_setting') || ''}
          onChange={(e) => handleFilterChange('work_setting', e.target.value)}
          aria-label="Work Setting"
        />
        <Select
          options={jobTypeOptions}
          value={searchParams.get('job_type') || ''}
          onChange={(e) => handleFilterChange('job_type', e.target.value)}
          aria-label="Job Type"
        />
        <Select
          options={experienceLevelOptions}
          value={searchParams.get('experience') || ''}
          onChange={(e) => handleFilterChange('experience', e.target.value)}
          aria-label="Experience Level"
        />
      </div>

      {/* Clear Filters */}
      {hasFilters && (
        <div>
          <button
            type="button"
            onClick={handleClearFilters}
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
