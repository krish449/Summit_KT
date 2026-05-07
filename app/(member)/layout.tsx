import { Navbar } from '@/components/layout/navbar';
import { MemberSidebar } from '@/components/layout/member-sidebar';
import { SetupPanel } from '@/components/layout/setup-panel';
import { requireMember } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/env';

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured()) {
    return (
      <SetupPanel
        title="Supabase configuration required"
        description="Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY to enable authentication, data access, and file storage."
      />
    );
  }

  const { profile } = await requireMember();

  return (
    <div className="min-h-screen bg-transparent">
      <Navbar profile={profile} />
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <MemberSidebar />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}