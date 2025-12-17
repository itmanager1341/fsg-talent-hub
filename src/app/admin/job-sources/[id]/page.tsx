import { Card, CardContent } from '@/components/ui/Card';
import { getJobSourceByIdAction } from '../actions';
import { redirect } from 'next/navigation';
import { SourceConfigForm } from './SourceConfigForm';

export const metadata = {
  title: 'Source Configuration | Job Sources | Admin | FSG Talent Hub',
};

export default async function SourceConfigPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const source = await getJobSourceByIdAction(id);

  if (!source) {
    redirect('/admin/job-sources');
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Source Configuration</h1>
        <p className="mt-1 text-gray-600">
          Configure job source settings and sync parameters.
        </p>
      </div>

      <div className="max-w-4xl">
        <Card>
          <CardContent className="pt-6">
            <SourceConfigForm source={source} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

