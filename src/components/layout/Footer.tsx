import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-gray-500">
            &copy; {currentYear} FSG Media. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link
              href="/jobs"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Jobs
            </Link>
            <Link
              href="/employers"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Employers
            </Link>
            <Link
              href="/privacy"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
