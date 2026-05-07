'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClientSupabaseClient } from '@/lib/supabase/client';
import { appEnv, isSupabaseConfigured } from '@/lib/env';

export function SignupForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  const supabaseReady = useMemo(() => isSupabaseConfigured(), []);

  const handleSignup = () => {
    setError(null);

    if (!supabaseReady) {
      setError('Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file.');
      return;
    }
    if (!fullName.trim()) { setError('Please enter your full name.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }

    const supabase = createClientSupabaseClient();
    if (!supabase) { setError('Could not connect to Supabase. Check your environment variables.'); return; }

    startTransition(async () => {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName.trim() },
          emailRedirectTo: `${appEnv.appUrl}/dashboard`,
        },
      });

      if (signUpError) { setError(signUpError.message); return; }

      if (data.session) {
        router.push('/dashboard');
        router.refresh();
        return;
      }

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
              We sent a confirmation link to{' '}
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
      {/* Header */}
      <div className="mb-6">
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-700">
          <span className="text-sm font-bold text-white">S</span>
        </div>
        <h2 className="text-xl font-semibold text-slate-900">Create your account</h2>
        <p className="mt-1 text-sm text-slate-500">Join Summit to access your assigned KT projects.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700" htmlFor="full-name">Full name</label>
          <Input id="full-name" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Smith" autoComplete="name" />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700" htmlFor="email">Work email</label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" autoComplete="email" />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700" htmlFor="password">Password</label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 characters" autoComplete="new-password" />
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
            onKeyDown={(e) => { if (e.key === 'Enter') handleSignup(); }}
          />
        </div>

        {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

        <Button className="w-full" disabled={isPending} onClick={handleSignup} type="button">
          {isPending ? 'Creating account…' : 'Create account'}
        </Button>

        <p className="pt-1 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-brand-700 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
