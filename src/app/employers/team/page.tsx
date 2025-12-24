import Link from 'next/link';
import { requireEmployer } from '@/lib/auth/requireAuth';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

export const metadata = {
  title: 'Team Management | FSG Talent Hub',
  description: 'Manage your team members and their access.',
};

interface Company {
  id: string;
  name: string;
  tier: string;
}

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  user: {
    email: string;
  } | null;
}

async function getTeamMembers(companyId: string): Promise<TeamMember[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('company_users')
    .select(`
      id,
      user_id,
      role,
      created_at
    `)
    .eq('company_id', companyId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching team members:', error);
    return [];
  }

  // Get user emails separately (since we can't join to auth.users directly)
  const memberIds = data?.map((m) => m.user_id) || [];
  if (memberIds.length === 0) return [];

  // For now, we'll just return the data without emails
  // In production, you'd use a server function to get user details
  return (data || []).map((member) => ({
    ...member,
    user: null, // Email would be fetched via admin API in production
  }));
}

const roleLabels: Record<string, string> = {
  owner: 'Owner',
  recruiter: 'Recruiter',
  viewer: 'Viewer',
};

const roleColors: Record<string, string> = {
  owner: 'bg-purple-100 text-purple-700',
  recruiter: 'bg-blue-100 text-blue-700',
  viewer: 'bg-gray-100 text-gray-700',
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default async function TeamManagementPage() {
  const { user, companyUser } = await requireEmployer();
  const company = (
    Array.isArray(companyUser.company)
      ? companyUser.company[0]
      : companyUser.company
  ) as Company;

  const teamMembers = await getTeamMembers(company.id);
  const isOwner = companyUser.role === 'owner';
  const isPremium = company.tier !== 'free';

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/employers/dashboard"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            &larr; Back to Dashboard
          </Link>
          <div className="mt-2 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Team Management
              </h1>
              <p className="mt-1 text-gray-600">
                Manage who has access to your company&apos;s job postings and applicants.
              </p>
            </div>
            {isOwner && isPremium && (
              <Button disabled>
                Invite Team Member
              </Button>
            )}
          </div>
        </div>

        {/* Upgrade CTA for Free Tier */}
        {!isPremium && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Upgrade to Add Team Members
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Premium plans allow you to invite recruiters and team members to collaborate on hiring.
                  </p>
                </div>
                <Link href="/employers/billing">
                  <Button>Upgrade Now</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Team Members List */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Team Members ({teamMembers.length})
            </h2>

            <div className="divide-y divide-gray-100">
              {/* Current User (always shown) */}
              <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                    <span className="text-sm font-medium text-blue-700">
                      {user.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{user.email}</p>
                    <p className="text-sm text-gray-500">You</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${roleColors[companyUser.role] || 'bg-gray-100 text-gray-700'}`}
                  >
                    {roleLabels[companyUser.role] || companyUser.role}
                  </span>
                  <span className="text-sm text-gray-400">
                    Joined {formatDate(companyUser.created_at)}
                  </span>
                </div>
              </div>

              {/* Other Team Members */}
              {teamMembers
                .filter((member) => member.user_id !== user.id)
                .map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between py-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                        <span className="text-sm font-medium text-gray-500">
                          ?
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          Team Member
                        </p>
                        <p className="text-sm text-gray-500">
                          {member.user_id.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${roleColors[member.role] || 'bg-gray-100 text-gray-700'}`}
                      >
                        {roleLabels[member.role] || member.role}
                      </span>
                      <span className="text-sm text-gray-400">
                        Joined {formatDate(member.created_at)}
                      </span>
                      {isOwner && member.role !== 'owner' && (
                        <button
                          className="text-sm text-red-600 hover:text-red-500"
                          disabled
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>

            {teamMembers.length <= 1 && isPremium && (
              <div className="mt-6 rounded-lg border-2 border-dashed border-gray-200 p-6 text-center">
                <p className="text-gray-500">No other team members yet.</p>
                <p className="mt-1 text-sm text-gray-400">
                  Invite recruiters to help manage your job postings.
                </p>
                <Button className="mt-4" disabled>
                  Invite Team Member
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Roles Explanation */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Team Roles
            </h2>
            <div className="space-y-4">
              <div>
                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${roleColors.owner}`}>
                  Owner
                </span>
                <p className="mt-1 text-sm text-gray-600">
                  Full access to all features including billing, team management, and company settings.
                </p>
              </div>
              <div>
                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${roleColors.recruiter}`}>
                  Recruiter
                </span>
                <p className="mt-1 text-sm text-gray-600">
                  Can create and manage job postings, view applicants, and access the resume database.
                </p>
              </div>
              <div>
                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${roleColors.viewer}`}>
                  Viewer
                </span>
                <p className="mt-1 text-sm text-gray-600">
                  Read-only access to job postings and applicants. Cannot make changes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coming Soon Notice */}
        <div className="mt-6 rounded-lg bg-blue-50 border border-blue-200 p-4">
          <p className="text-sm text-blue-700">
            <strong>Coming Soon:</strong> Team invitations, role management, and activity logs will be available in a future update.
          </p>
        </div>
      </div>
    </div>
  );
}
