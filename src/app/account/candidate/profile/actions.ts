'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/requireAuth';

interface ActionResult {
  error?: string;
  success?: boolean;
}

/**
 * Extracts the storage object name for a resume stored in the `resumes` bucket.
 *
 * Historical note: earlier versions stored a public URL in `candidates.resume_url`.
 * Current behavior stores the *object name* (e.g. `{userId}/{fileName}`) so we can
 * keep the bucket private and serve downloads via signed URLs.
 */
function extractResumeObjectName(maybeUrlOrPath: string): string | null {
  if (!maybeUrlOrPath) return null;

  // If it looks like a URL, try to pull the portion after `/resumes/`.
  if (maybeUrlOrPath.startsWith('http://') || maybeUrlOrPath.startsWith('https://')) {
    const parts = maybeUrlOrPath.split('/resumes/');
    if (parts[1]) return parts[1];
    // Fall back to last path segment (best-effort).
    const last = maybeUrlOrPath.split('/').pop();
    return last || null;
  }

  // Otherwise treat it as an object name already.
  return maybeUrlOrPath;
}

export async function uploadResume(formData: FormData): Promise<ActionResult> {
  const user = await requireAuth();
  const supabase = await createClient();

  const file = formData.get('file') as File;
  const candidateId = formData.get('candidateId') as string;

  if (!file || !candidateId) {
    return { error: 'Missing required fields' };
  }

  // Verify candidate ownership
  const { data: candidate } = await supabase
    .from('candidates')
    .select('id, user_id, resume_url')
    .eq('id', candidateId)
    .single();

  if (!candidate || candidate.user_id !== user.id) {
    return { error: 'Unauthorized' };
  }

  // Delete old resume if exists
  if (candidate.resume_url) {
    const oldObjectName = extractResumeObjectName(candidate.resume_url);
    if (oldObjectName) {
      await supabase.storage.from('resumes').remove([oldObjectName]);
    }
  }

  // Upload new resume
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const filePath = `${user.id}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('resumes')
    .upload(filePath, file, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    console.error('Upload error:', uploadError);
    return { error: 'Failed to upload resume. Please try again.' };
  }

  // Update candidate record
  const { error: updateError } = await supabase
    .from('candidates')
    .update({
      // Store the object name so the bucket can remain private.
      resume_url: filePath,
      resume_filename: file.name,
      resume_uploaded_at: new Date().toISOString(),
    })
    .eq('id', candidateId);

  if (updateError) {
    console.error('Update error:', updateError);
    return { error: 'Failed to save resume. Please try again.' };
  }

  return { success: true };
}

export async function deleteResume(candidateId: string): Promise<ActionResult> {
  const user = await requireAuth();
  const supabase = await createClient();

  // Verify candidate ownership
  const { data: candidate } = await supabase
    .from('candidates')
    .select('id, user_id, resume_url')
    .eq('id', candidateId)
    .single();

  if (!candidate || candidate.user_id !== user.id) {
    return { error: 'Unauthorized' };
  }

  if (!candidate.resume_url) {
    return { error: 'No resume to delete' };
  }

  // Delete from storage
  const objectName = extractResumeObjectName(candidate.resume_url);
  if (objectName) {
    await supabase.storage.from('resumes').remove([objectName]);
  }

  // Update candidate record
  const { error: updateError } = await supabase
    .from('candidates')
    .update({
      resume_url: null,
      resume_filename: null,
      resume_uploaded_at: null,
    })
    .eq('id', candidateId);

  if (updateError) {
    console.error('Update error:', updateError);
    return { error: 'Failed to delete resume. Please try again.' };
  }

  return { success: true };
}

export async function updateProfile(formData: FormData): Promise<ActionResult> {
  const user = await requireAuth();
  const supabase = await createClient();

  const candidateId = formData.get('candidateId') as string;

  // Verify candidate ownership
  const { data: candidate } = await supabase
    .from('candidates')
    .select('id, user_id')
    .eq('id', candidateId)
    .single();

  if (!candidate || candidate.user_id !== user.id) {
    return { error: 'Unauthorized' };
  }

  // Parse form data
  const firstName = formData.get('first_name') as string;
  const lastName = formData.get('last_name') as string;
  const email = formData.get('email') as string;
  const phone = formData.get('phone') as string | null;
  const headline = formData.get('headline') as string | null;
  const city = formData.get('city') as string | null;
  const state = formData.get('state') as string | null;
  const willingToRelocate = formData.get('willing_to_relocate') === 'true';
  const desiredWorkSettings = JSON.parse(
    (formData.get('desired_work_settings') as string) || '[]'
  );
  const desiredJobTypes = JSON.parse(
    (formData.get('desired_job_types') as string) || '[]'
  );
  const desiredSalaryMin = formData.get('desired_salary_min');
  const summary = formData.get('summary') as string | null;
  const isSearchable = formData.get('is_searchable') === 'true';

  // Validate required fields
  if (!firstName || !lastName || !email) {
    return { error: 'First name, last name, and email are required' };
  }

  // Update candidate record
  const { error: updateError } = await supabase
    .from('candidates')
    .update({
      first_name: firstName,
      last_name: lastName,
      email,
      phone: phone || null,
      headline: headline || null,
      city: city || null,
      state: state && state !== 'OTHER' ? state : null,
      willing_to_relocate: willingToRelocate,
      desired_work_settings: desiredWorkSettings,
      desired_job_types: desiredJobTypes,
      desired_salary_min: desiredSalaryMin
        ? parseInt(desiredSalaryMin as string, 10)
        : null,
      summary: summary || null,
      is_searchable: isSearchable,
    })
    .eq('id', candidateId);

  if (updateError) {
    console.error('Update error:', updateError);
    return { error: 'Failed to update profile. Please try again.' };
  }

  return { success: true };
}
