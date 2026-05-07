import 'server-only';

import { redirect } from 'next/navigation';

import type { UserProfile } from '@/lib/types/database';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function getCurrentUserContext() {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return { user: null, profile: null as UserProfile | null };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null as UserProfile | null };
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .maybeSingle<UserProfile>();

  return {
    user,
    profile: profile ?? null,
  };
}

export async function requireAuthenticatedUser() {
  const context = await getCurrentUserContext();

  if (!context.user) {
    redirect('/login');
  }

  return context;
}

export async function requireAdmin() {
  const context = await requireAuthenticatedUser();

  if (context.profile?.role !== 'admin') {
    redirect('/dashboard');
  }

  return context;
}

export async function requireMember() {
  const context = await requireAuthenticatedUser();

  if (context.profile?.role === 'admin') {
    redirect('/admin/dashboard');
  }

  return context;
}