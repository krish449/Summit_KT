'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

import { createClientSupabaseClient } from '@/lib/supabase/client';

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClientSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    }
  };

  return (
    <button
      onClick={handleLogout}
      title="Log out"
      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
    >
      <LogOut className="h-4 w-4" />
    </button>
  );
}
