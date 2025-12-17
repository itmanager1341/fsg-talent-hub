import { requireAdmin } from '@/lib/auth/requireAuth';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { MobileAdminNav } from '@/components/admin/MobileAdminNav';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Single auth check for all admin routes
  await requireAdmin();

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64">
        <AdminSidebar />
      </div>

      {/* Main content area */}
      <div className="flex flex-1 flex-col lg:pl-64">
        {/* Mobile navigation */}
        <MobileAdminNav />

        {/* Page content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
