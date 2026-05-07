import { Navbar } from '@/components/layout/navbar';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { SetupPanel } from '@/components/layout/setup-panel';
import { requireAdmin } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/env';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured()) {
    return (
      <SetupPanel
        title="Supabase configuration required"
        description="Admin screens require the full Supabase environment to manage projects, documents, members, quizzes, and analytics."
      />
    );
  }

  const { profile } = await requireAdmin();

  return (
    <div className="min-h-screen bg-transparent">
      <Navbar profile={profile} />
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <AdminSidebar />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}