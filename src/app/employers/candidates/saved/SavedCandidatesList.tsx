'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { InviteToApplyModal } from '@/components/employer/InviteToApply';
import {
  unsaveCandidate,
  updateSavedCandidateNotes,
  type SavedCandidate,
} from '../actions';

interface SavedCandidatesListProps {
  initialCandidates: SavedCandidate[];
}

export function SavedCandidatesList({ initialCandidates }: SavedCandidatesListProps) {
  const [candidates, setCandidates] = useState(initialCandidates);
  const [isPending, startTransition] = useTransition();
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState('');
  const [inviteCandidate, setInviteCandidate] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const handleRemove = (candidateId: string) => {
    startTransition(async () => {
      const result = await unsaveCandidate(candidateId);
      if (result.success) {
        setCandidates((prev) =>
          prev.filter((c) => c.candidate_id !== candidateId)
        );
      }
    });
  };

  const startEditingNotes = (saved: SavedCandidate) => {
    setEditingNotes(saved.candidate_id);
    setNotesValue(saved.notes || '');
  };

  const saveNotes = (candidateId: string) => {
    startTransition(async () => {
      const result = await updateSavedCandidateNotes(candidateId, notesValue);
      if (result.success) {
        setCandidates((prev) =>
          prev.map((c) =>
            c.candidate_id === candidateId ? { ...c, notes: notesValue } : c
          )
        );
        setEditingNotes(null);
      }
    });
  };

  const cancelEditingNotes = () => {
    setEditingNotes(null);
    setNotesValue('');
  };

  return (
    <>
      <div className="mb-4 text-sm text-gray-600">
        {candidates.length} saved candidate{candidates.length !== 1 ? 's' : ''}
      </div>

      <div className="space-y-4">
        {candidates.map((saved) => {
          const candidate = saved.candidate;
          const name =
            candidate.first_name || candidate.last_name
              ? `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim()
              : 'Anonymous Candidate';

          const location =
            candidate.city && candidate.state
              ? `${candidate.city}, ${candidate.state}`
              : candidate.city || candidate.state || null;

          const isEditing = editingNotes === saved.candidate_id;

          return (
            <Card key={saved.id} className="transition hover:shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      <Link
                        href={`/candidates/${candidate.id}`}
                        className="hover:text-blue-600"
                      >
                        {name}
                      </Link>
                    </h3>

                    {candidate.headline && (
                      <p className="mt-1 text-sm text-gray-600">
                        {candidate.headline}
                      </p>
                    )}

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                      {location && <span>{location}</span>}
                      {candidate.email && (
                        <a
                          href={`mailto:${candidate.email}`}
                          className="text-blue-600 hover:text-blue-500"
                        >
                          {candidate.email}
                        </a>
                      )}
                      {candidate.resume_url && (
                        <a
                          href={`/api/resumes/${candidate.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-500"
                        >
                          View Resume
                        </a>
                      )}
                    </div>

                    {/* Notes Section */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      {isEditing ? (
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Notes
                          </label>
                          <textarea
                            value={notesValue}
                            onChange={(e) => setNotesValue(e.target.value)}
                            placeholder="Add notes about this candidate..."
                            rows={3}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => saveNotes(saved.candidate_id)}
                              disabled={isPending}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={cancelEditingNotes}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">
                              Notes
                            </span>
                            <button
                              onClick={() => startEditingNotes(saved)}
                              className="text-xs text-blue-600 hover:text-blue-500"
                            >
                              {saved.notes ? 'Edit' : 'Add notes'}
                            </button>
                          </div>
                          {saved.notes ? (
                            <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">
                              {saved.notes}
                            </p>
                          ) : (
                            <p className="mt-1 text-sm text-gray-400 italic">
                              No notes yet
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mt-3 text-xs text-gray-400">
                      Saved on{' '}
                      {new Date(saved.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() =>
                        setInviteCandidate({ id: candidate.id, name })
                      }
                    >
                      Invite to Apply
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemove(saved.candidate_id)}
                      disabled={isPending}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Invite Modal */}
      {inviteCandidate && (
        <InviteToApplyModal
          candidateId={inviteCandidate.id}
          candidateName={inviteCandidate.name}
          isOpen={true}
          onClose={() => setInviteCandidate(null)}
        />
      )}
    </>
  );
}
