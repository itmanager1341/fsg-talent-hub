'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface ResumeViewButtonProps {
  candidateId: string;
  label?: string;
}

export function ResumeViewButton({ candidateId, label }: ResumeViewButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openResume = async () => {
    try {
      setError(null);
      setLoading(true);
      const res = await fetch(`/api/resumes/${candidateId}`);
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error || 'Failed to open resume');
      }
      const body = (await res.json()) as { url?: string };
      if (!body.url) throw new Error('No resume URL returned');
      window.open(body.url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to open resume');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button variant="outline" size="sm" onClick={openResume} disabled={loading}>
        {loading ? 'Opening...' : label || 'View Resume'}
      </Button>
      {error && <div className="mt-2 text-xs text-red-600">{error}</div>}
    </div>
  );
}

