'use client';

import { useState } from 'react';
import { BookOpen, RotateCcw, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface QuizResultRow {
  attemptId: string;
  userId: string;
  member: string;
  email: string;
  score: string;
  percentage: string;
  setTaken: string;
  submittedAt: string;
}

interface QuizResultsCardProps {
  projectId: string;
  rows: QuizResultRow[];
  resetAction: (formData: FormData) => Promise<void>;
}

export function QuizResultsCard({ projectId, rows, resetAction }: QuizResultsCardProps) {
  const [filter, setFilter] = useState('');
  const [resetting, setResetting] = useState<string | null>(null);

  const filtered = filter
    ? rows.filter((r) =>
        [r.member, r.email, r.score, r.percentage, r.setTaken, r.submittedAt].some((v) =>
          v.toLowerCase().includes(filter.toLowerCase()),
        ),
      )
    : rows;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-slate-400" />
          <CardTitle>Quiz results</CardTitle>
          {rows.length > 0 && (
            <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
              {rows.length} submitted
            </span>
          )}
        </div>
        {rows.length > 0 && (
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-8 pr-4 text-sm"
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter by name or set…"
              value={filter}
            />
          </div>
        )}
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 px-6 py-10 text-center">
            <BookOpen className="mx-auto h-7 w-7 text-slate-300" />
            <p className="mt-3 text-sm text-slate-400">No quiz submissions yet.</p>
            <p className="mt-1 text-xs text-slate-400">Results will appear here once members complete their quiz.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-3 pr-6 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Member</th>
                  <th className="pb-3 pr-6 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Score</th>
                  <th className="pb-3 pr-6 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">%</th>
                  <th className="pb-3 pr-6 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Set taken</th>
                  <th className="pb-3 pr-6 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Submitted</th>
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((row) => (
                  <tr key={row.attemptId}>
                    <td className="py-3 pr-6">
                      <p className="font-medium text-slate-900">{row.member}</p>
                      <p className="text-xs text-slate-400">{row.email}</p>
                    </td>
                    <td className="py-3 pr-6">
                      <span className="font-semibold text-slate-900">{row.score}</span>
                    </td>
                    <td className="py-3 pr-6">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        parseFloat(row.percentage) >= 70
                          ? 'bg-emerald-50 text-emerald-700'
                          : parseFloat(row.percentage) >= 50
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}>
                        {row.percentage}
                      </span>
                    </td>
                    <td className="py-3 pr-6 text-slate-600">{row.setTaken}</td>
                    <td className="py-3 pr-6 text-slate-400">{row.submittedAt}</td>
                    <td className="py-3">
                      <form
                        action={resetAction}
                        onSubmit={(e) => {
                          if (!confirm(`Reset quiz for ${row.member}? They will be able to take the quiz again.`)) {
                            e.preventDefault();
                          } else {
                            setResetting(row.attemptId);
                          }
                        }}
                      >
                        <input type="hidden" name="attempt_id" value={row.attemptId} />
                        <input type="hidden" name="project_id" value={projectId} />
                        <Button
                          size="sm"
                          type="submit"
                          variant="secondary"
                          disabled={resetting === row.attemptId}
                          className="flex items-center gap-1.5"
                        >
                          <RotateCcw className="h-3 w-3" />
                          {resetting === row.attemptId ? 'Resetting…' : 'Reset'}
                        </Button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="py-6 text-center text-sm text-slate-400">No results match your filter.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
