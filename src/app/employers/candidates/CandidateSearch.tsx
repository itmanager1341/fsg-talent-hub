'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  searchCandidates,
  getMatchingCandidates,
  saveCandidate,
  unsaveCandidate,
  type CandidateSearchResult,
  type CandidateSearchFilters,
} from './actions';

interface CandidateSearchProps {
  companyId: string;
  activeJobs: { id: string; title: string }[];
  availableStates: string[];
}

const jobTypeOptions = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
  { value: 'temporary', label: 'Temporary' },
];

const workSettingOptions = [
  { value: 'onsite', label: 'On-site' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
];

export function CandidateSearch({
  activeJobs,
  availableStates,
}: CandidateSearchProps) {
  const [isPending, startTransition] = useTransition();
  const [candidates, setCandidates] = useState<CandidateSearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Filter state
  const [query, setQuery] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [willingToRelocate, setWillingToRelocate] = useState(false);
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>([]);
  const [selectedWorkSettings, setSelectedWorkSettings] = useState<string[]>([]);
  const [matchJobId, setMatchJobId] = useState('');

  // Selected candidate for preview
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateSearchResult | null>(null);

  const pageSize = 20;

  const handleSearch = (newPage: number = 1) => {
    setError(null);
    setPage(newPage);
    setHasSearched(true);

    const filters: CandidateSearchFilters = {
      query: query.trim() || undefined,
      state: state || undefined,
      city: city.trim() || undefined,
      willingToRelocate: willingToRelocate || undefined,
      jobTypes: selectedJobTypes.length > 0 ? selectedJobTypes : undefined,
      workSettings: selectedWorkSettings.length > 0 ? selectedWorkSettings : undefined,
    };

    startTransition(async () => {
      const result = await searchCandidates(filters, newPage, pageSize);
      if (result.error) {
        setError(result.error);
        setCandidates([]);
        setTotal(0);
      } else {
        setCandidates(result.candidates);
        setTotal(result.total);
      }
    });
  };

  const handleAIMatch = () => {
    if (!matchJobId) return;

    setError(null);
    setHasSearched(true);

    startTransition(async () => {
      const result = await getMatchingCandidates(matchJobId);
      if (result.error) {
        setError(result.error);
        setCandidates([]);
        setTotal(0);
      } else {
        setCandidates(result.candidates);
        setTotal(result.candidates.length);
        setPage(1);
      }
    });
  };

  const handleToggleSave = async (candidate: CandidateSearchResult) => {
    startTransition(async () => {
      if (candidate.is_saved) {
        await unsaveCandidate(candidate.id);
      } else {
        await saveCandidate(candidate.id);
      }
      // Update local state
      setCandidates((prev) =>
        prev.map((c) =>
          c.id === candidate.id ? { ...c, is_saved: !c.is_saved } : c
        )
      );
    });
  };

  const clearFilters = () => {
    setQuery('');
    setState('');
    setCity('');
    setWillingToRelocate(false);
    setSelectedJobTypes([]);
    setSelectedWorkSettings([]);
    setMatchJobId('');
  };

  const toggleJobType = (value: string) => {
    setSelectedJobTypes((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    );
  };

  const toggleWorkSetting = (value: string) => {
    setSelectedWorkSettings((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    );
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="grid gap-6 lg:grid-cols-4">
      {/* Filters Sidebar */}
      <div className="lg:col-span-1">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Filters</h2>
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Clear all
              </button>
            </div>

            {/* AI Match by Job */}
            {activeJobs.length > 0 && (
              <div className="mb-6 pb-6 border-b border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AI Match by Job
                </label>
                <select
                  value={matchJobId}
                  onChange={(e) => setMatchJobId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select a job...</option>
                  {activeJobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.title}
                    </option>
                  ))}
                </select>
                <Button
                  onClick={handleAIMatch}
                  disabled={!matchJobId || isPending}
                  variant="secondary"
                  size="sm"
                  className="mt-2 w-full"
                >
                  Find Matching Candidates
                </Button>
              </div>
            )}

            {/* Text Search */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Name, headline, summary..."
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Location */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Any state</option>
                {availableStates.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Austin"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="mb-4">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={willingToRelocate}
                  onChange={(e) => setWillingToRelocate(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Willing to relocate
              </label>
            </div>

            {/* Job Type */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Type Preferences
              </label>
              <div className="space-y-1">
                {jobTypeOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 text-sm text-gray-700"
                  >
                    <input
                      type="checkbox"
                      checked={selectedJobTypes.includes(option.value)}
                      onChange={() => toggleJobType(option.value)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Work Setting */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Work Setting Preferences
              </label>
              <div className="space-y-1">
                {workSettingOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 text-sm text-gray-700"
                  >
                    <input
                      type="checkbox"
                      checked={selectedWorkSettings.includes(option.value)}
                      onChange={() => toggleWorkSetting(option.value)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>

            <Button
              onClick={() => handleSearch(1)}
              disabled={isPending}
              className="w-full"
            >
              {isPending ? 'Searching...' : 'Search Candidates'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      <div className="lg:col-span-3">
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {!hasSearched ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Search for Candidates
              </h3>
              <p className="text-gray-600">
                Use the filters on the left to find qualified candidates, or use AI
                matching to find candidates that best fit one of your open positions.
              </p>
            </CardContent>
          </Card>
        ) : isPending ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-gray-500">Searching...</div>
            </CardContent>
          </Card>
        ) : candidates.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-gray-500">
                No candidates found matching your criteria.
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Results header */}
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {(page - 1) * pageSize + 1}–
                {Math.min(page * pageSize, total)} of {total} candidates
              </p>
            </div>

            {/* Candidate cards */}
            <div className="space-y-4">
              {candidates.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  onToggleSave={() => handleToggleSave(candidate)}
                  onViewProfile={() => setSelectedCandidate(candidate)}
                  isPending={isPending}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSearch(page - 1)}
                  disabled={page === 1 || isPending}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSearch(page + 1)}
                  disabled={page === totalPages || isPending}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Quick Preview Modal */}
      {selectedCandidate && (
        <CandidateQuickPreview
          candidate={selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
          onToggleSave={() => {
            handleToggleSave(selectedCandidate);
            setSelectedCandidate({
              ...selectedCandidate,
              is_saved: !selectedCandidate.is_saved,
            });
          }}
        />
      )}
    </div>
  );
}

// Candidate Card Component
function CandidateCard({
  candidate,
  onToggleSave,
  onViewProfile,
  isPending,
}: {
  candidate: CandidateSearchResult;
  onToggleSave: () => void;
  onViewProfile: () => void;
  isPending: boolean;
}) {
  const name =
    candidate.first_name || candidate.last_name
      ? `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim()
      : 'Anonymous Candidate';

  const location =
    candidate.city && candidate.state
      ? `${candidate.city}, ${candidate.state}`
      : candidate.city || candidate.state || null;

  return (
    <Card className="transition hover:shadow-md">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {name}
              </h3>
              {candidate.match_score !== undefined && (
                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                  {candidate.match_score}% match
                </span>
              )}
            </div>

            {candidate.headline && (
              <p className="mt-1 text-sm text-gray-600 line-clamp-1">
                {candidate.headline}
              </p>
            )}

            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
              {location && <span>{location}</span>}
              {candidate.willing_to_relocate && (
                <span className="text-blue-600">Open to relocation</span>
              )}
              {candidate.resume_url && (
                <span className="text-green-600">Resume on file</span>
              )}
            </div>

            {candidate.summary && (
              <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                {candidate.summary}
              </p>
            )}

            {/* Preferences */}
            <div className="mt-3 flex flex-wrap gap-2">
              {candidate.desired_job_types?.map((type) => (
                <span
                  key={type}
                  className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                >
                  {type.replace('_', ' ')}
                </span>
              ))}
              {candidate.desired_work_settings?.map((setting) => (
                <span
                  key={setting}
                  className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600"
                >
                  {setting}
                </span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={onViewProfile}>
              View Profile
            </Button>
            <Button
              variant={candidate.is_saved ? 'secondary' : 'outline'}
              size="sm"
              onClick={onToggleSave}
              disabled={isPending}
            >
              {candidate.is_saved ? 'Saved' : 'Save'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Quick Preview Modal
function CandidateQuickPreview({
  candidate,
  onClose,
  onToggleSave,
}: {
  candidate: CandidateSearchResult;
  onClose: () => void;
  onToggleSave: () => void;
}) {
  const name =
    candidate.first_name || candidate.last_name
      ? `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim()
      : 'Anonymous Candidate';

  const location =
    candidate.city && candidate.state
      ? `${candidate.city}, ${candidate.state}`
      : candidate.city || candidate.state || null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-2xl rounded-lg bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">{name}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
            {candidate.headline && (
              <p className="text-gray-600 mb-4">{candidate.headline}</p>
            )}

            <div className="grid gap-4 sm:grid-cols-2 mb-6">
              {location && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Location</dt>
                  <dd className="mt-1 text-sm text-gray-900">{location}</dd>
                </div>
              )}
              {candidate.email && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <a
                      href={`mailto:${candidate.email}`}
                      className="text-blue-600 hover:text-blue-500"
                    >
                      {candidate.email}
                    </a>
                  </dd>
                </div>
              )}
              {candidate.phone && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Phone</dt>
                  <dd className="mt-1 text-sm text-gray-900">{candidate.phone}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500">Relocation</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {candidate.willing_to_relocate
                    ? 'Open to relocation'
                    : 'Not open to relocation'}
                </dd>
              </div>
            </div>

            {candidate.summary && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Summary</h3>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">
                  {candidate.summary}
                </p>
              </div>
            )}

            {/* Preferences */}
            {(candidate.desired_job_types?.length > 0 ||
              candidate.desired_work_settings?.length > 0) && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Preferences
                </h3>
                <div className="flex flex-wrap gap-2">
                  {candidate.desired_job_types?.map((type) => (
                    <span
                      key={type}
                      className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600"
                    >
                      {type.replace('_', ' ')}
                    </span>
                  ))}
                  {candidate.desired_work_settings?.map((setting) => (
                    <span
                      key={setting}
                      className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600"
                    >
                      {setting}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {candidate.resume_url && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Resume</h3>
                <a
                  href={`/api/resumes/${candidate.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500"
                >
                  <svg
                    className="mr-1.5 h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  View Resume
                </a>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button
              variant={candidate.is_saved ? 'secondary' : 'primary'}
              onClick={onToggleSave}
            >
              {candidate.is_saved ? 'Remove from Saved' : 'Save Candidate'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
