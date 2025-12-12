import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

export default function Home() {
  return (
    <div className="bg-gray-50">
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl font-semibold text-gray-900 mb-4">
            Find Your Next Role in Financial Services
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Connect with top employers in mortgage servicing, M&A advisory, and financial services.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button size="lg">Browse Jobs</Button>
            <Button variant="outline" size="lg">
              Post a Job
            </Button>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                For Candidates
              </h3>
              <p className="text-gray-600 text-sm">
                AI-powered job matching, resume tools, and direct access to
                industry-leading employers.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                For Employers
              </h3>
              <p className="text-gray-600 text-sm">
                Quality applicant pipeline with AI-enhanced matching and
                streamlined hiring tools.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Industry Focus
              </h3>
              <p className="text-gray-600 text-sm">
                Specialized for FSI, AM&AA, and partner associations in
                financial services.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
