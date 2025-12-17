'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { updateInvitationStatus } from '@/app/employers/candidates/actions';
import type { CandidateInvitation } from '@/app/employers/candidates/actions';

interface JobInvitationsProps {
  initialInvitations: CandidateInvitation[];
}

export function JobInvitations({ initialInvitations }: JobInvitationsProps) {
  const [invitations, setInvitations] = useState(initialInvitations);
  const [isPending, startTransition] = useTransition();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (invitations.length === 0) {
    return null;
  }

  const pendingCount = invitations.filter((i) => i.status === 'pending').length;

  const handleMarkViewed = (invitationId: string) => {
    startTransition(async () => {
      const result = await updateInvitationStatus(invitationId, 'viewed');
      if (result.success) {
        setInvitations((prev) =>
          prev.map((i) =>
            i.id === invitationId ? { ...i, status: 'viewed' } : i
          )
        );
      }
    });
  };

  const handleDecline = (invitationId: string) => {
    startTransition(async () => {
      const result = await updateInvitationStatus(invitationId, 'declined');
      if (result.success) {
        setInvitations((prev) =>
          prev.map((i) =>
            i.id === invitationId ? { ...i, status: 'declined' } : i
          )
        );
      }
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-blue-100 text-blue-700',
    viewed: 'bg-gray-100 text-gray-700',
    applied: 'bg-green-100 text-green-700',
    declined: 'bg-red-100 text-red-700',
  };

  return (
    <Card className={pendingCount > 0 ? 'border-blue-200 bg-blue-50/30' : ''}>
      <CardContent className="pt-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900">
              Job Invitations
            </h2>
            {pendingCount > 0 && (
              <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">
                {pendingCount} new
              </span>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {invitations.map((invitation) => {
            const job = invitation.job;
            const company = job?.company;
            const isExpanded = expandedId === invitation.id;
            const isPendingStatus = invitation.status === 'pending';

            return (
              <div
                key={invitation.id}
                className={`rounded-lg border p-4 ${
                  isPendingStatus
                    ? 'border-blue-200 bg-white'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {job ? (
                        <Link
                          href={`/jobs/${job.id}`}
                          className="font-medium text-gray-900 hover:text-blue-600"
                        >
                          {job.title}
                        </Link>
                      ) : (
                        <span className="font-medium text-gray-500">
                          Job no longer available
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          statusColors[invitation.status] || statusColors.pending
                        }`}
                      >
                        {invitation.status === 'pending'
                          ? 'New'
                          : invitation.status.charAt(0).toUpperCase() +
                            invitation.status.slice(1)}
                      </span>
                    </div>
                    {company && (
                      <p className="text-sm text-gray-500">{company.name}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Invited on {formatDate(invitation.created_at)}
                    </p>

                    {/* Message */}
                    {invitation.message && (
                      <div className="mt-3">
                        <button
                          onClick={() =>
                            setExpandedId(isExpanded ? null : invitation.id)
                          }
                          className="text-sm text-blue-600 hover:text-blue-500"
                        >
                          {isExpanded ? 'Hide message' : 'View message'}
                        </button>
                        {isExpanded && (
                          <div className="mt-2 rounded-lg bg-gray-100 p-3 text-sm text-gray-700">
                            {invitation.message}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {job && invitation.status !== 'declined' && (
                    <div className="flex flex-col gap-2 shrink-0">
                      {invitation.status === 'applied' ? (
                        <span className="text-sm text-green-600 font-medium">
                          Applied
                        </span>
                      ) : (
                        <>
                          <Link href={`/jobs/${job.id}/apply`}>
                            <Button
                              size="sm"
                              onClick={() => {
                                // Mark as viewed when they click to apply
                                if (invitation.status === 'pending') {
                                  handleMarkViewed(invitation.id);
                                }
                              }}
                            >
                              Apply Now
                            </Button>
                          </Link>
                          {invitation.status === 'pending' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDecline(invitation.id)}
                              disabled={isPending}
                            >
                              Not Interested
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {invitation.status === 'declined' && (
                    <span className="text-sm text-gray-500">Declined</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
