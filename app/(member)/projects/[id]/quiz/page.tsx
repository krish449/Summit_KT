import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { redirect } from 'next/navigation';

import { QuizExperience } from '@/components/quiz/quiz-experience';
import { requireMember } from '@/lib/auth';
import { getProjectById, getQuizAttemptForProject, userHasProjectAccess } from '@/lib/data';

export default async function ProjectQuizPage({ params }: { params: { id: string } }) {
  const { profile } = await requireMember();
  const canAccess = await userHasProjectAccess(profile!.id, profile?.role, params.id);

  if (!canAccess) {
    redirect('/dashboard');
  }

  const [project, attempt] = await Promise.all([getProjectById(params.id), getQuizAttemptForProject(profile!.id, params.id)]);

  let lockedAttempt = null;

  if (attempt?.status === 'submitted') {
    lockedAttempt = {
      score: attempt.score ?? 0,
      totalMarks: attempt.total_marks ?? 0,
      percentage: Number(attempt.percentage ?? 0),
    };
  }

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/dashboard" className="transition hover:text-slate-900">Dashboard</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/projects/${params.id}`} className="transition hover:text-slate-900">{project?.name ?? 'Project'}</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-slate-900">Quiz</span>
      </nav>
      <QuizExperience lockedAttempt={lockedAttempt} projectId={params.id} projectName={project?.name ?? 'Project'} />
    </div>
  );
}