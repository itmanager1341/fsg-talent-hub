import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { getUser } from '@/lib/auth/requireAuth';
import './globals.css';

export const metadata: Metadata = {
  title: 'FSG Talent Hub | Jobs in Financial Services',
  description:
    'Find your next career opportunity in mortgage servicing, M&A advisory, and financial services.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const user = await getUser();

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <Header user={user} />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
