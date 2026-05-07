'use client';

import { createBrowserClient } from '@supabase/ssr';

import { appEnv, isSupabaseConfigured } from '@/lib/env';

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClientSupabaseClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!browserClient) {
    browserClient = createBrowserClient(appEnv.supabaseUrl!, appEnv.supabaseAnonKey!);
  }

  return browserClient;
}