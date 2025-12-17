import { createClient } from '@/lib/supabase/server';
import { JobInvitations } from './JobInvitations';
import type { CandidateInvitation } from '@/app/employers/candidates/actions';

export async function JobInvitationsSection({
  candidateId,
}: {
  candidateId: string;
}) {
  const supabase = await createClient();

  const { data: invitations } = await supabase
    .from('candidate_invitations')
    .select(
      `
      id, job_id, candidate_id, message, status, created_at, viewed_at,
      job:jobs(id, title, company:companies(name))
    `
    )
    .eq('candidate_id', candidateId)
    .order('created_at', { ascending: false })
    .limit(10);

  const formattedInvitations: CandidateInvitation[] = (invitations || []).map(
    (inv) => {
      const job = Array.isArray(inv.job) ? inv.job[0] : inv.job;
      const company = job?.company
        ? Array.isArray(job.company)
          ? job.company[0]
          : job.company
        : null;
      return {
        id: inv.id,
        job_id: inv.job_id,
        candidate_id: inv.candidate_id,
        message: inv.message,
        status: inv.status as CandidateInvitation['status'],
        created_at: inv.created_at,
        viewed_at: inv.viewed_at,
        job: job
          ? {
              id: job.id,
              title: job.title,
              company,
            }
          : undefined,
      };
    }
  );

  if (formattedInvitations.length === 0) {
    return null;
  }

  return <JobInvitations initialInvitations={formattedInvitations} />;
}
