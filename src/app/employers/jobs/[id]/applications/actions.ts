'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/requireAuth';

interface ActionResult {
  error?: string;
  success?: boolean;
}

export async function updateApplicationStatus(
  applicationId: string,
  status: string
): Promise<ActionResult> {
  const user = await requireAuth();
  const supabase = await createClient();

  // Get application with job info to verify access
  const { data: application } = await supabase
    .from('applications')
    .select(
      `
      id,
      job:jobs!inner(
        id,
        company_id
      )
    `
    )
    .eq('id', applicationId)
    .single();

  if (!application) {
    return { error: 'Application not found' };
  }

  const job = Array.isArray(application.job)
    ? application.job[0]
    : application.job;

  // Verify user has access to this company
  const { data: companyUser } = await supabase
    .from('company_users')
    .select('id, role')
    .eq('company_id', job.company_id)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (!companyUser || !['owner', 'recruiter'].includes(companyUser.role)) {
    return { error: 'You do not have permission to update this application' };
  }

  // Validate status
  const validStatuses = [
    'applied',
    'viewed',
    'screening',
    'interviewing',
    'offered',
    'hired',
    'rejected',
  ];
  if (!validStatuses.includes(status)) {
    return { error: 'Invalid status' };
  }

  // Update application status
  const { error } = await supabase
    .from('applications')
    .update({
      status,
      status_changed_at: new Date().toISOString(),
      status_changed_by: user.id,
      viewed_at:
        status !== 'applied' ? new Date().toISOString() : undefined,
    })
    .eq('id', applicationId);

  if (error) {
    console.error('Error updating application status:', error);
    return { error: 'Failed to update application status' };
  }

  return { success: true };
}
