import { requireCandidate } from '@/lib/auth/requireAuth';
import { ProfileForm } from './ProfileForm';
import { ResumeUpload } from './ResumeUpload';
import { Card, CardContent } from '@/components/ui/Card';
import Link from 'next/link';

export const metadata = {
  title: 'Edit Profile | FSG Talent Hub',
  description: 'Update your candidate profile and resume.',
};

export default async function CandidateProfilePage() {
  const { candidate } = await requireCandidate();

  return (
    <div className="bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/account/candidate"
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            &larr; Back to dashboard
          </Link>
        </div>

        <h1 className="mb-8 text-2xl font-bold text-gray-900">Edit Profile</h1>

        {/* Resume Section */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Resume</h2>
            <ResumeUpload
              candidateId={candidate.id}
              currentResumeUrl={candidate.resume_url}
              currentResumeFilename={candidate.resume_filename}
            />
          </CardContent>
        </Card>

        {/* Profile Form */}
        <ProfileForm candidate={candidate} />
      </div>
    </div>
  );
}
