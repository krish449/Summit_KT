'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClientSupabaseClient } from '@/lib/supabase/client';

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    setError(null);

    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }

    const supabase = createClientSupabaseClient();
    if (!supabase) { setError('Could not connect. Please try again.'); return; }

    startTransition(async () => {
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) { setError(updateError.message); return; }
      setDone(true);
      setTimeout(() => router.push('/dashboard'), 2000);
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
            <p className="text-base font-semibold text-slate-900">Password updated</p>
            <p className="mt-1 text-sm text-slate-500">Redirecting you to the dashboard…</p>
          </div>
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
        <h2 className="text-xl font-semibold text-slate-900">Set new password</h2>
        <p className="mt-1 text-sm text-slate-500">Choose a strong password for your account.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700" htmlFor="password">New password</label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
            autoComplete="new-password"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700" htmlFor="confirm">Confirm password</label>
          <Input
            id="confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
          />
        </div>

        {error && (
          <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
        )}

        <Button className="w-full" disabled={isPending} onClick={handleSubmit} type="button">
          {isPending ? 'Updating…' : 'Update password'}
        </Button>
      </div>
    </div>
  );
}
