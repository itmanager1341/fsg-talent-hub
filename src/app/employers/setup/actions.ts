'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/requireAuth';

interface CreateCompanyResult {
  error?: string;
  companyId?: string;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function createCompany(
  formData: FormData
): Promise<CreateCompanyResult> {
  const user = await requireAuth();
  const supabase = await createClient();

  // Check if user already has a company
  const { data: existingCompanyUser } = await supabase
    .from('company_users')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (existingCompanyUser) {
    return { error: 'You already have a company associated with your account' };
  }

  // Parse form data
  const name = formData.get('name') as string;
  const website = formData.get('website') as string | null;
  const industry = formData.get('industry') as string | null;
  const companySize = formData.get('company_size') as string | null;
  const description = formData.get('description') as string | null;
  const headquartersCity = formData.get('headquarters_city') as string | null;
  const headquartersState = formData.get('headquarters_state') as string | null;

  // Validate required fields
  if (!name || name.trim().length < 2) {
    return { error: 'Company name is required (minimum 2 characters)' };
  }

  // Generate unique slug
  let slug = generateSlug(name);
  let slugSuffix = 0;

  // Check for slug uniqueness
  while (true) {
    const testSlug = slugSuffix === 0 ? slug : `${slug}-${slugSuffix}`;
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('id')
      .eq('slug', testSlug)
      .single();

    if (!existingCompany) {
      slug = testSlug;
      break;
    }
    slugSuffix++;
  }

  // Create company record
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .insert({
      name: name.trim(),
      slug,
      website: website || null,
      industry: industry || null,
      company_size: companySize || null,
      description: description || null,
      headquarters_city: headquartersCity || null,
      headquarters_state:
        headquartersState && headquartersState !== 'OTHER'
          ? headquartersState
          : null,
      tier: 'free',
      is_verified: false,
      is_active: true,
    })
    .select('id')
    .single();

  if (companyError) {
    console.error('Error creating company:', companyError);
    return { error: 'Failed to create company. Please try again.' };
  }

  // Create company_users record (owner role)
  const { error: companyUserError } = await supabase
    .from('company_users')
    .insert({
      company_id: company.id,
      user_id: user.id,
      role: 'owner',
      is_active: true,
    });

  if (companyUserError) {
    console.error('Error creating company user:', companyUserError);
    // Clean up: delete the company we just created
    await supabase.from('companies').delete().eq('id', company.id);
    return { error: 'Failed to set up company access. Please try again.' };
  }

  return { companyId: company.id };
}
