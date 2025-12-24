import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireEmployer } from '@/lib/auth/requireAuth';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { revalidatePath } from 'next/cache';

export const metadata = {
  title: 'Company Settings | FSG Talent Hub',
  description: 'Manage your company profile and settings.',
};

interface Company {
  id: string;
  name: string;
  slug: string;
  website: string | null;
  logo_url: string | null;
  description: string | null;
  industry: string | null;
  size: string | null;
  location_city: string | null;
  location_state: string | null;
}

async function updateCompanyAction(formData: FormData) {
  'use server';

  const supabase = await createClient();
  const companyId = formData.get('companyId') as string;

  const updateData = {
    name: formData.get('name') as string,
    website: formData.get('website') as string || null,
    description: formData.get('description') as string || null,
    industry: formData.get('industry') as string || null,
    size: formData.get('size') as string || null,
    location_city: formData.get('location_city') as string || null,
    location_state: formData.get('location_state') as string || null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('companies')
    .update(updateData)
    .eq('id', companyId);

  if (error) {
    console.error('Error updating company:', error);
    return;
  }

  revalidatePath('/employers/settings');
  revalidatePath('/employers/dashboard');
  redirect('/employers/settings?success=true');
}

export default async function EmployerSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const { companyUser } = await requireEmployer();
  const company = (
    Array.isArray(companyUser.company)
      ? companyUser.company[0]
      : companyUser.company
  ) as Company;

  const params = await searchParams;
  const showSuccess = params.success === 'true';

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/employers/dashboard"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            &larr; Back to Dashboard
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">
            Company Settings
          </h1>
          <p className="mt-1 text-gray-600">
            Update your company profile information.
          </p>
        </div>

        {showSuccess && (
          <div className="mb-6 rounded-lg bg-green-50 border border-green-200 p-4">
            <p className="text-sm text-green-700">
              Company settings updated successfully.
            </p>
          </div>
        )}

        <Card>
          <CardContent className="pt-6">
            <form action={updateCompanyAction}>
              <input type="hidden" name="companyId" value={company.id} />

              <div className="space-y-6">
                {/* Company Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Company Name *
                  </label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                    defaultValue={company.name}
                    className="mt-1"
                  />
                </div>

                {/* Website */}
                <div>
                  <label
                    htmlFor="website"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Website
                  </label>
                  <Input
                    id="website"
                    name="website"
                    type="url"
                    placeholder="https://example.com"
                    defaultValue={company.website || ''}
                    className="mt-1"
                  />
                </div>

                {/* Description */}
                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Company Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    defaultValue={company.description || ''}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Tell candidates about your company..."
                  />
                </div>

                {/* Industry */}
                <div>
                  <label
                    htmlFor="industry"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Industry
                  </label>
                  <Input
                    id="industry"
                    name="industry"
                    type="text"
                    placeholder="e.g., Financial Services, Technology"
                    defaultValue={company.industry || ''}
                    className="mt-1"
                  />
                </div>

                {/* Company Size */}
                <div>
                  <label
                    htmlFor="size"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Company Size
                  </label>
                  <select
                    id="size"
                    name="size"
                    defaultValue={company.size || ''}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select size</option>
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-500">201-500 employees</option>
                    <option value="501-1000">501-1000 employees</option>
                    <option value="1000+">1000+ employees</option>
                  </select>
                </div>

                {/* Location */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="location_city"
                      className="block text-sm font-medium text-gray-700"
                    >
                      City
                    </label>
                    <Input
                      id="location_city"
                      name="location_city"
                      type="text"
                      placeholder="e.g., New York"
                      defaultValue={company.location_city || ''}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="location_state"
                      className="block text-sm font-medium text-gray-700"
                    >
                      State
                    </label>
                    <Input
                      id="location_state"
                      name="location_state"
                      type="text"
                      placeholder="e.g., NY"
                      defaultValue={company.location_state || ''}
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Logo URL (read-only for now) */}
                {company.logo_url && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Company Logo
                    </label>
                    <div className="mt-2 flex items-center gap-4">
                      <img
                        src={company.logo_url}
                        alt={`${company.name} logo`}
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                      <p className="text-sm text-gray-500">
                        To update your logo, please contact support.
                      </p>
                    </div>
                  </div>
                )}

                {/* Submit */}
                <div className="flex items-center justify-end gap-4 pt-4 border-t">
                  <Link href="/employers/dashboard">
                    <Button variant="outline" type="button">
                      Cancel
                    </Button>
                  </Link>
                  <Button type="submit">Save Changes</Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
