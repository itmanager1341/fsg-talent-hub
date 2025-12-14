'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { uploadResume, deleteResume } from './actions';

interface ResumeUploadProps {
  candidateId: string;
  currentResumeUrl: string | null;
  currentResumeFilename: string | null;
}

const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function ResumeUpload({
  candidateId,
  currentResumeUrl,
  currentResumeFilename,
}: ResumeUploadProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const openResume = async () => {
    try {
      setError(null);
      setIsOpening(true);

      const res = await fetch(`/api/resumes/${candidateId}`, { method: 'GET' });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error || 'Failed to open resume');
      }

      const body = (await res.json()) as { url?: string };
      if (!body.url) {
        throw new Error('No resume URL returned');
      }

      window.open(body.url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to open resume');
    } finally {
      setIsOpening(false);
    }
  };

  const handleFileSelect = async (file: File) => {
    setError(null);

    // Validate file type
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      setError('Please upload a PDF or Word document');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('candidateId', candidateId);

    const result = await uploadResume(formData);

    if (result.error) {
      setError(result.error);
    } else {
      router.refresh();
    }

    setIsUploading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete your resume?')) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    const result = await deleteResume(candidateId);

    if (result.error) {
      setError(result.error);
    } else {
      router.refresh();
    }

    setIsDeleting(false);
  };

  if (currentResumeUrl) {
    return (
      <div>
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center gap-3">
            <svg
              className="h-8 w-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <div>
              <p className="font-medium text-gray-900">
                {currentResumeFilename || 'Resume uploaded'}
              </p>
              <p className="text-sm text-gray-500">Click to view or replace</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={openResume}
              disabled={isOpening}
            >
              {isOpening ? 'Opening...' : 'View'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Replace'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleInputChange}
          className="hidden"
        />

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <div
        className={`rounded-lg border-2 border-dashed p-8 text-center transition ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <p className="mt-4 text-gray-600">
          Drag and drop your resume here, or{' '}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="font-medium text-blue-600 hover:text-blue-500"
            disabled={isUploading}
          >
            browse
          </button>
        </p>
        <p className="mt-2 text-sm text-gray-500">
          PDF or Word documents up to 5MB
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleInputChange}
          className="hidden"
        />

        {isUploading && (
          <div className="mt-4">
            <div className="mx-auto h-2 w-48 overflow-hidden rounded-full bg-gray-200">
              <div className="h-full animate-pulse bg-blue-600" />
            </div>
            <p className="mt-2 text-sm text-gray-500">Uploading...</p>
          </div>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
