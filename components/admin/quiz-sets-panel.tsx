'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  marks: number;
}

interface QuizSet {
  id: string;
  set_name: string;
  set_number: number;
  questions: Question[];
}

interface QuizSetsPanelProps {
  projectId: string;
  sets: QuizSet[];
  deleteAction: (formData: FormData) => Promise<void>;
  addQuestionAction: (formData: FormData) => Promise<void>;
  importCsvAction: (formData: FormData) => Promise<void>;
}

export function QuizSetsPanel({ projectId, sets, deleteAction, addQuestionAction, importCsvAction }: QuizSetsPanelProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [addingTo, setAddingTo] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {sets.map((set) => {
        const isOpen = expanded === set.id;
        const isAdding = addingTo === set.id;
        const functional = set.set_name.toLowerCase().includes('functional');
        const technical = set.set_name.toLowerCase().includes('technical');
        const tagColor = functional
          ? 'bg-blue-50 text-blue-700'
          : technical
          ? 'bg-violet-50 text-violet-700'
          : 'bg-slate-100 text-slate-600';

        return (
          <Card key={set.id} className="overflow-hidden">
            <CardHeader className="py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold ${tagColor}`}>
                    {functional ? 'Functional' : technical ? 'Technical' : 'Other'}
                  </span>
                  <CardTitle className="truncate text-base">{set.set_name}</CardTitle>
                  <span className="shrink-0 text-sm text-slate-400">{set.questions.length} questions</span>
                </div>
                <div className="flex items-center gap-2">
                  <form action={deleteAction}>
                    <input type="hidden" name="set_id" value={set.id} />
                    <input type="hidden" name="project_id" value={projectId} />
                    <Button
                      size="sm"
                      type="submit"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600"
                      onClick={(e) => {
                        if (!confirm(`Delete "${set.set_name}" and all ${set.questions.length} questions? This cannot be undone.`)) {
                          e.preventDefault();
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </form>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => setExpanded(isOpen ? null : set.id)}
                  >
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardHeader>

            {isOpen && (
              <CardContent className="space-y-4 border-t border-slate-100 pt-4">
                {/* Questions list */}
                {set.questions.length > 0 ? (
                  <div className="space-y-2">
                    {set.questions.map((q, index) => (
                      <div key={q.id} className="flex items-start gap-3 rounded-xl bg-slate-50 px-4 py-3">
                        <span className="mt-0.5 shrink-0 text-xs font-semibold text-slate-400">{index + 1}.</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-900">{q.question_text}</p>
                          <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-slate-500">
                            <span>A: {q.option_a}</span>
                            <span>B: {q.option_b}</span>
                            <span>C: {q.option_c}</span>
                            <span>D: {q.option_d}</span>
                          </div>
                          <p className="mt-1 text-xs font-semibold text-emerald-600">Correct: {q.correct_option} · {q.marks} mark{q.marks !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">No questions in this set yet.</p>
                )}

                {/* Add question toggle */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    type="button"
                    variant="secondary"
                    onClick={() => setAddingTo(isAdding ? null : set.id)}
                  >
                    {isAdding ? 'Cancel' : '+ Add question'}
                  </Button>
                </div>

                {isAdding && (
                  <form action={addQuestionAction} className="grid gap-3 rounded-2xl border border-slate-200 p-4 lg:grid-cols-2" onSubmit={() => setAddingTo(null)}>
                    <input name="project_id" type="hidden" value={projectId} />
                    <input name="quiz_set_id" type="hidden" value={set.id} />
                    <div className="lg:col-span-2">
                      <Textarea name="question_text" placeholder="Question text" required />
                    </div>
                    <Input name="option_a" placeholder="Option A" required />
                    <Input name="option_b" placeholder="Option B" required />
                    <Input name="option_c" placeholder="Option C" required />
                    <Input name="option_d" placeholder="Option D" required />
                    <Input name="correct_option" placeholder="Correct option (A, B, C or D)" required />
                    <Input defaultValue="1" min={1} name="marks" type="number" />
                    <div className="lg:col-span-2">
                      <Textarea name="explanation" placeholder="Explanation (optional)" />
                    </div>
                    <Button className="lg:w-fit" type="submit">Save question</Button>
                  </form>
                )}

                {/* CSV import */}
                <details className="rounded-xl border border-slate-100">
                  <summary className="cursor-pointer px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900">
                    Import questions via CSV
                  </summary>
                  <form action={importCsvAction} className="space-y-3 px-4 pb-4 pt-2">
                    <input name="project_id" type="hidden" value={projectId} />
                    <input name="quiz_set_id" type="hidden" value={set.id} />
                    <p className="text-xs text-slate-400">
                      Columns: question_text, option_a, option_b, option_c, option_d, correct_option, explanation, marks
                    </p>
                    <Textarea name="csv_text" placeholder="Paste CSV rows here…" rows={4} />
                    <Button size="sm" type="submit" variant="secondary">Import</Button>
                  </form>
                </details>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
