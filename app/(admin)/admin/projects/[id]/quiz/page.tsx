import Link from 'next/link';
import { BookOpen, ChevronRight } from 'lucide-react';

import { createQuizQuestionAction, createQuizSetAction, deleteQuizSetAction, importQuizCsvAction } from '@/app/actions/admin';
import { QuizGenerator } from '@/components/admin/quiz-generator';
import { QuizSetsPanel } from '@/components/admin/quiz-sets-panel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getProjectById, getProjectQuizSets } from '@/lib/data';

export default async function ProjectQuizAdminPage({ params }: { params: { id: string } }) {
  const [project, sets] = await Promise.all([
    getProjectById(params.id),
    getProjectQuizSets(params.id),
  ]);

  const totalQuestions = sets.reduce((sum, s) => sum + s.questions.length, 0);

  return (
    <div className="space-y-8">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/admin/projects" className="transition hover:text-slate-900">Projects</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/admin/projects/${params.id}`} className="transition hover:text-slate-900">{project?.name ?? 'Project'}</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-slate-900">Quiz</span>
      </nav>

      {/* Existing sets */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Quiz sets</h2>
            <p className="text-sm text-slate-500">
              {sets.length === 0
                ? 'No sets yet — generate or create one below.'
                : `${sets.length} set${sets.length !== 1 ? 's' : ''} · ${totalQuestions} questions total`}
            </p>
          </div>
          {sets.length > 0 && (() => {
            const fCount = sets.filter((s) => s.set_name.toLowerCase().includes('functional')).length;
            const tCount = sets.filter((s) => s.set_name.toLowerCase().includes('technical')).length;
            const missing = fCount === 0 ? 'functional' : tCount === 0 ? 'technical' : null;
            return (
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700">
                  <BookOpen className="h-4 w-4" />
                  {fCount} functional · {tCount} technical
                </div>
                {missing && (
                  <p className="text-xs font-medium text-amber-600">
                    ⚠ No {missing} sets — members will only receive {missing === 'functional' ? 'technical' : 'functional'} questions. Generate {missing} sets below.
                  </p>
                )}
              </div>
            );
          })()}
        </div>

        {sets.length > 0 ? (
          <QuizSetsPanel
            projectId={params.id}
            sets={sets}
            deleteAction={deleteQuizSetAction}
            addQuestionAction={createQuizQuestionAction}
            importCsvAction={importQuizCsvAction}
          />
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 px-6 py-12 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-sm text-slate-500">No quiz sets have been created yet.</p>
            <p className="mt-1 text-xs text-slate-400">Use the AI generator below or create a set manually.</p>
          </div>
        )}
      </div>

      {/* Generate */}
      <QuizGenerator projectId={params.id} />

      {/* Manual create */}
      <Card>
        <CardHeader>
          <CardTitle>Create quiz set manually</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createQuizSetAction} className="grid gap-4 md:grid-cols-3">
            <input name="project_id" type="hidden" value={params.id} />
            <Input name="set_name" placeholder="Set name" required />
            <Input name="set_number" placeholder="Set number" required type="number" />
            <Button className="md:w-fit" type="submit">Create set</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
