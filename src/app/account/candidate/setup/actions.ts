'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/requireAuth';

interface CreateCandidateResult {
  error?: string;
  candidateId?: string;
}

export async function createCandidate(
  formData: FormData
): Promise<CreateCandidateResult> {
  const user = await requireAuth();
  const supabase = await createClient();

  // Check if candidate already exists
  const { data: existing } = await supabase
    .from('candidates')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (existing) {
    return { error: 'Candidate profile already exists' };
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

  // Validate required fields
  if (!firstName || !lastName || !email) {
    return { error: 'First name, last name, and email are required' };
  }

  // Create candidate record
  const { data, error } = await supabase
    .from('candidates')
    .insert({
      user_id: user.id,
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
      profile_complete: false,
      is_searchable: true,
      is_active: true,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating candidate:', error);
    return { error: 'Failed to create profile. Please try again.' };
  }

  return { candidateId: data.id };
}
