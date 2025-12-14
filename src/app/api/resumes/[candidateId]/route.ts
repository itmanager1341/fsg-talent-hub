import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Returns a short-lived signed URL to view a candidate resume.
 *
 * Access rules (enforced both by RLS + this handler):
 * - Candidate can view their own resume
 * - Employer (company_users member) can view candidate resumes (per V0 policy)
 * - Admin can view everything
 *
 * Note: `candidates.resume_url` stores the storage object name in the `resumes`
 * bucket (e.g. `{userId}/{fileName}`), not a public URL.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ candidateId: string }> }
) {
  const { candidateId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [{ data: adminRow }, { data: companyUser }] = await Promise.all([
    supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle(),
    supabase
      .from('company_users')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle(),
  ]);

  const isAdmin = !!adminRow;
  const isEmployer = !!companyUser;

  const { data: candidate, error: candidateError } = await supabase
    .from('candidates')
    .select('id, user_id, resume_url, resume_filename, is_active')
    .eq('id', candidateId)
    .single();

  if (candidateError || !candidate) {
    return NextResponse.json(
      { error: 'Candidate not found or not accessible' },
      { status: 404 }
    );
  }

  if (!candidate.is_active) {
    return NextResponse.json({ error: 'Candidate inactive' }, { status: 403 });
  }

  const isOwner = candidate.user_id === user.id;
  if (!isOwner && !isAdmin && !isEmployer) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!candidate.resume_url) {
    return NextResponse.json({ error: 'No resume on file' }, { status: 404 });
  }

  const objectName = candidate.resume_url.startsWith('http://') ||
    candidate.resume_url.startsWith('https://')
    ? candidate.resume_url.split('/resumes/')[1] || candidate.resume_url
    : candidate.resume_url;
  const { data: signed, error: signedError } = await supabase.storage
    .from('resumes')
    .createSignedUrl(objectName, 60 * 15);

  if (signedError || !signed?.signedUrl) {
    return NextResponse.json(
      { error: 'Failed to create signed URL' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    url: signed.signedUrl,
    filename: candidate.resume_filename,
    expiresInSeconds: 60 * 15,
  });
}

