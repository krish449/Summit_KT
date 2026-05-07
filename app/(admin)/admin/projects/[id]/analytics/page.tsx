import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

import { resetQuizAttemptAction } from '@/app/actions/admin';
import { AnalyticsTable } from '@/components/admin/analytics-table';
import { QuizResultsCard } from '@/components/admin/quiz-results-card';
import { getProjectAnalytics, getProjectById } from '@/lib/data';

export default async function ProjectAnalyticsPage({ params }: { params: { id: string } }) {
  const [project, analytics] = await Promise.all([
    getProjectById(params.id),
    getProjectAnalytics(params.id),
  ]);

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/admin/projects" className="transition hover:text-slate-900">Projects</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/admin/projects/${params.id}`} className="transition hover:text-slate-900">{project?.name ?? 'Project'}</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-slate-900">Analytics</span>
      </nav>
      <QuizResultsCard projectId={params.id} rows={analytics.quizResults} resetAction={resetQuizAttemptAction} />
      <AnalyticsTable rows={analytics.chatbotUsage} title="Chatbot usage" />
      <AnalyticsTable rows={analytics.loginActivity} title="Login activity" />
    </div>
  );
}
