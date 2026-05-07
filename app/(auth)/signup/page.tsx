import { redirect } from 'next/navigation';

import { SignupForm } from '@/components/auth/signup-form';
import { getCurrentUserContext } from '@/lib/auth';

export default async function SignupPage() {
  const { profile } = await getCurrentUserContext();

  if (profile?.role === 'admin') redirect('/admin/dashboard');
  if (profile) redirect('/dashboard');

  return (
    <main className="min-h-screen bg-hero-grid">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center gap-12 px-4 py-16 sm:px-6 lg:flex-row lg:gap-20 lg:px-8">

        {/* Left — brand copy */}
        <div className="flex-1 space-y-6 text-center text-white lg:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent-300">
            Summit · Knowledge Transfer Portal
          </p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Your team&apos;s knowledge,<br />
            structured and searchable.
          </h1>
          <p className="max-w-md text-base leading-relaxed text-slate-300">
            Create an account to access your assigned KT projects, ask the AI assistant, and complete your one-time readiness assessment.
          </p>
          <div className="flex flex-wrap justify-center gap-6 pt-2 text-sm text-slate-400 lg:justify-start">
            <span>📄 Document RAG</span>
            <span>🤖 Groq AI chat</span>
            <span>✅ One-time quiz</span>
          </div>
        </div>

        {/* Right — form */}
        <div className="w-full max-w-sm shrink-0 lg:max-w-md">
          <SignupForm />
        </div>

      </div>
    </main>
  );
}
