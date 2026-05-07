import { ResetPasswordForm } from '@/components/auth/reset-password-form';

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-hero-grid">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center gap-12 px-4 py-16 sm:px-6 lg:flex-row lg:gap-20 lg:px-8">
        <div className="flex-1 space-y-6 text-center text-white lg:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent-300">
            Summit · Knowledge Transfer Portal
          </p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Set a new<br />password
          </h1>
          <p className="max-w-md text-base leading-relaxed text-slate-300">
            Choose a strong password to secure your Summit account.
          </p>
        </div>

        <div className="w-full max-w-sm shrink-0 lg:max-w-md">
          <ResetPasswordForm />
        </div>
      </div>
    </main>
  );
}
