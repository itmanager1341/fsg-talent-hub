import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service | FSG Talent Hub',
  description: 'Terms of service for FSG Talent Hub job board platform.',
};

export default function TermsOfServicePage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            &larr; Back to Home
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>

        <div className="prose prose-gray max-w-none">
          <p className="text-gray-600 mb-6">
            Last updated: December 2024
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-600 mb-4">
              By accessing and using FSG Talent Hub (&quot;the Platform&quot;), you agree to be bound by
              these Terms of Service. If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Description of Services</h2>
            <p className="text-gray-600 mb-4">
              FSG Talent Hub provides an online job board platform that connects job seekers with employers.
              Our services include:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>Job posting and management for employers</li>
              <li>Job search and application for candidates</li>
              <li>Resume building and optimization tools</li>
              <li>AI-powered job matching and recommendations</li>
              <li>Applicant tracking and management</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. User Accounts</h2>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Registration</h3>
            <p className="text-gray-600 mb-4">
              To access certain features, you must create an account. You agree to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized use</li>
              <li>Be responsible for all activities under your account</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-900 mb-2">Account Types</h3>
            <p className="text-gray-600 mb-4">
              We offer different account types for candidates and employers, each with specific
              features and pricing. Detailed information is available on our pricing page.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. User Conduct</h2>
            <p className="text-gray-600 mb-4">
              You agree not to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>Post false, misleading, or fraudulent content</li>
              <li>Impersonate another person or entity</li>
              <li>Harvest or collect user information without consent</li>
              <li>Use the platform for illegal purposes</li>
              <li>Interfere with the platform&apos;s operation</li>
              <li>Post discriminatory job listings</li>
              <li>Spam or harass other users</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Job Postings (Employers)</h2>
            <p className="text-gray-600 mb-4">
              Employers using our platform agree to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>Post only legitimate job opportunities</li>
              <li>Comply with all applicable employment laws</li>
              <li>Not discriminate based on protected characteristics</li>
              <li>Provide accurate job descriptions and requirements</li>
              <li>Respond to applicants in a timely manner</li>
              <li>Not use candidate information for purposes other than hiring</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Applications (Candidates)</h2>
            <p className="text-gray-600 mb-4">
              Candidates using our platform agree to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>Provide truthful information in resumes and applications</li>
              <li>Not misrepresent qualifications or experience</li>
              <li>Apply only for positions you are genuinely interested in</li>
              <li>Respect employer communication preferences</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Payment Terms</h2>
            <p className="text-gray-600 mb-4">
              For paid services:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>Fees are charged according to the selected plan</li>
              <li>Subscriptions automatically renew unless cancelled</li>
              <li>Refunds are subject to our refund policy</li>
              <li>We may change pricing with 30 days notice</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Intellectual Property</h2>
            <p className="text-gray-600 mb-4">
              The Platform and its content are owned by FSG Media and protected by intellectual
              property laws. You may not copy, modify, or distribute our content without permission.
            </p>
            <p className="text-gray-600 mb-4">
              You retain ownership of content you submit but grant us a license to use it
              in connection with our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Disclaimers</h2>
            <p className="text-gray-600 mb-4">
              THE PLATFORM IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND. WE DO NOT GUARANTEE:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>That you will find employment or qualified candidates</li>
              <li>The accuracy of job listings or user profiles</li>
              <li>Uninterrupted or error-free service</li>
              <li>The conduct of other users</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Limitation of Liability</h2>
            <p className="text-gray-600 mb-4">
              To the maximum extent permitted by law, FSG Media shall not be liable for any
              indirect, incidental, special, consequential, or punitive damages arising from
              your use of the Platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Indemnification</h2>
            <p className="text-gray-600 mb-4">
              You agree to indemnify and hold harmless FSG Media from any claims, damages,
              or expenses arising from your use of the Platform or violation of these terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Termination</h2>
            <p className="text-gray-600 mb-4">
              We may terminate or suspend your account at any time for violations of these terms.
              You may close your account at any time through your account settings.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">13. Dispute Resolution</h2>
            <p className="text-gray-600 mb-4">
              Any disputes arising from these terms shall be resolved through binding arbitration
              in accordance with applicable laws. You waive any right to participate in class action lawsuits.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">14. Changes to Terms</h2>
            <p className="text-gray-600 mb-4">
              We may modify these terms at any time. Continued use of the Platform after changes
              constitutes acceptance of the new terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">15. Contact Information</h2>
            <p className="text-gray-600 mb-4">
              For questions about these Terms of Service, please contact:
            </p>
            <p className="text-gray-600">
              FSG Media<br />
              Email: legal@fsgmedia.com<br />
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t">
          <Link
            href="/privacy"
            className="text-blue-600 hover:text-blue-500"
          >
            View Privacy Policy &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
