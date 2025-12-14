'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/requireAuth';

interface ActionResult {
  error?: string;
  success?: boolean;
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
    const oldPath = candidate.resume_url.split('/').pop();
    if (oldPath) {
      await supabase.storage.from('resumes').remove([`${user.id}/${oldPath}`]);
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

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from('resumes').getPublicUrl(filePath);

  // Update candidate record
  const { error: updateError } = await supabase
    .from('candidates')
    .update({
      resume_url: publicUrl,
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
  const pathParts = candidate.resume_url.split('/resumes/');
  if (pathParts[1]) {
    await supabase.storage.from('resumes').remove([pathParts[1]]);
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
