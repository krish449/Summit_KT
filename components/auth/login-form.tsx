'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClientSupabaseClient } from '@/lib/supabase/client';
import { appEnv, isSupabaseConfigured } from '@/lib/env';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const supabaseReady = useMemo(() => isSupabaseConfigured(), []);

  const handlePasswordLogin = () => {
    if (!supabaseReady) {
      setMessage('Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file.');
      return;
    }

    const supabase = createClientSupabaseClient();

    if (!supabase) {
      setMessage('Could not connect to Supabase. Check your environment variables.');
      return;
    }

    startTransition(async () => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setMessage(error.message);
        return;
      }

      router.push('/dashboard');
      router.refresh();
    });
  };

  const handleMagicLink = () => {
    if (!supabaseReady) {
      setMessage('Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file.');
      return;
    }

    const supabase = createClientSupabaseClient();

    if (!supabase) {
      setMessage('Could not connect to Supabase. Check your environment variables.');
      return;
    }

    startTransition(async () => {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${appEnv.appUrl}/dashboard` },
      });

      setMessage(error ? error.message : 'Magic link sent — check your inbox.');
    });
  };

  return (
    <div className="w-full rounded-2xl bg-white p-8 shadow-2xl ring-1 ring-black/5">
      {/* Header */}
      <div className="mb-6">
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-700">
          <span className="text-sm font-bold text-white">S</span>
        </div>
        <h2 className="text-xl font-semibold text-slate-900">Sign in to Summit</h2>
        <p className="mt-1 text-sm text-slate-500">Use your work email to continue to your KT projects.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700" htmlFor="email">
            Work email
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            autoComplete="email"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700" htmlFor="password">
              Password
            </label>
            <Link href="/forgot-password" className="text-xs text-brand-700 hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handlePasswordLogin();
            }}
          />
        </div>

        {message && (
          <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">{message}</p>
        )}

        <Button className="w-full" disabled={isPending} onClick={handlePasswordLogin} type="button">
          {isPending ? 'Signing in…' : 'Sign in with password'}
        </Button>

        <div className="relative flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs text-slate-400">or</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <Button className="w-full" disabled={isPending} onClick={handleMagicLink} type="button" variant="secondary">
          Send magic link
        </Button>

        <p className="pt-1 text-center text-sm text-slate-500">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-medium text-brand-700 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}