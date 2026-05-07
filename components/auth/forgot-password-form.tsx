'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClientSupabaseClient } from '@/lib/supabase/client';
import { appEnv, isSupabaseConfigured } from '@/lib/env';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  const supabaseReady = useMemo(() => isSupabaseConfigured(), []);

  const handleSubmit = () => {
    setError(null);

    if (!supabaseReady) {
      setError('Supabase is not configured.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    const supabase = createClientSupabaseClient();
    if (!supabase) { setError('Could not connect to Supabase.'); return; }

    startTransition(async () => {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${appEnv.appUrl}/auth/callback?next=/reset-password`,
      });

      if (resetError) { setError(resetError.message); return; }
      setDone(true);
    });
  };

  if (done) {
    return (
      <div className="w-full rounded-2xl bg-white p-8 shadow-2xl ring-1 ring-black/5">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-base font-semibold text-slate-900">Check your inbox</p>
            <p className="mt-1 text-sm text-slate-500">
              We sent a password reset link to{' '}
              <span className="font-medium text-slate-700">{email}</span>.
            </p>
          </div>
          <Link href="/login" className="text-sm font-medium text-brand-700 hover:underline">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl bg-white p-8 shadow-2xl ring-1 ring-black/5">
      <div className="mb-6">
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-700">
          <span className="text-sm font-bold text-white">S</span>
        </div>
        <h2 className="text-xl font-semibold text-slate-900">Reset your password</h2>
        <p className="mt-1 text-sm text-slate-500">
          Enter your work email and we&apos;ll send you a reset link.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700" htmlFor="email">Work email</label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            autoComplete="email"
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
          />
        </div>

        {error && (
          <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
        )}

        <Button className="w-full" disabled={isPending} onClick={handleSubmit} type="button">
          {isPending ? 'Sending…' : 'Send reset link'}
        </Button>

        <p className="pt-1 text-center text-sm text-slate-500">
          Remember your password?{' '}
          <Link href="/login" className="font-medium text-brand-700 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
