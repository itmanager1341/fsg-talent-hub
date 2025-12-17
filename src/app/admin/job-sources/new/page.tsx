import { Card, CardContent } from '@/components/ui/Card';
import { CreateSourceForm } from './CreateSourceForm';

export const metadata = {
  title: 'Add Job Source | Admin | FSG Talent Hub',
};

export default async function NewSourcePage() {
  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add Job Source</h1>
        <p className="mt-1 text-gray-600">
          Configure a new external job source to sync jobs from.
        </p>
      </div>

      <div className="max-w-4xl">
        <Card>
          <CardContent className="pt-6">
            <CreateSourceForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

