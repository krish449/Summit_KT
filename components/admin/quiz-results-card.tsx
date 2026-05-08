'use client';

import { useState, useTransition } from 'react';
import { BookOpen, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ChevronsUpDown, RotateCcw, Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PAGE_SIZE = 10;
const MAX_RESETS = 2;

type SortKey = 'member' | 'score' | 'percentage' | 'setTaken' | 'submittedAt';
type SortDir = 'asc' | 'desc';

export interface QuizResultRow {
  attemptId: string;
  userId: string;
  member: string;
  email: string;
  score: string;
  percentage: string;
  setTaken: string;
  submittedAt: string;
  resetCount: number;
}

interface QuizResultsCardProps {
  projectId: string;
  adminId?: string;
  rows: QuizResultRow[];
  resetAction: (formData: FormData) => Promise<void>;
}

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronsUpDown className="ml-1 inline h-3 w-3 text-slate-300" />;
  return sortDir === 'asc'
    ? <ChevronUp className="ml-1 inline h-3 w-3 text-brand-600" />
    : <ChevronDown className="ml-1 inline h-3 w-3 text-brand-600" />;
}

export function QuizResultsCard({ projectId, adminId, rows, resetAction }: QuizResultsCardProps) {
  const [filter, setFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('submittedAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const [pendingReset, setPendingReset] = useState<QuizResultRow | null>(null);
  const [reason, setReason] = useState('');
  const [isPending, startTransition] = useTransition();

  function toggleSort(col: SortKey) {
    if (col === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(col);
      setSortDir('asc');
    }
    setPage(1);
  }

  const filtered = filter
    ? rows.filter((r) =>
        [r.member, r.email, r.score, r.percentage, r.setTaken, r.submittedAt].some((v) =>
          v.toLowerCase().includes(filter.toLowerCase()),
        ),
      )
    : rows;

  const sorted = [...filtered].sort((a, b) => {
    let va = a[sortKey];
    let vb = b[sortKey];
    if (sortKey === 'percentage') {
      va = String(parseFloat(va));
      vb = String(parseFloat(vb));
      return sortDir === 'asc' ? parseFloat(va) - parseFloat(vb) : parseFloat(vb) - parseFloat(va);
    }
    return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function openResetModal(row: QuizResultRow) {
    setReason('');
    setPendingReset(row);
  }

  function closeModal() {
    setPendingReset(null);
    setReason('');
  }

  function handleResetSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!pendingReset) return;
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await resetAction(fd);
      closeModal();
    });
  }

  const thCls = 'pb-3 pr-6 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 cursor-pointer select-none hover:text-slate-800 whitespace-nowrap';

  return (
    <>
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
                onChange={(e) => { setFilter(e.target.value); setPage(1); }}
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
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className={thCls} onClick={() => toggleSort('member')}>
                        Member <SortIcon col="member" sortKey={sortKey} sortDir={sortDir} />
                      </th>
                      <th className={thCls} onClick={() => toggleSort('score')}>
                        Score <SortIcon col="score" sortKey={sortKey} sortDir={sortDir} />
                      </th>
                      <th className={thCls} onClick={() => toggleSort('percentage')}>
                        % <SortIcon col="percentage" sortKey={sortKey} sortDir={sortDir} />
                      </th>
                      <th className={thCls} onClick={() => toggleSort('setTaken')}>
                        Set taken <SortIcon col="setTaken" sortKey={sortKey} sortDir={sortDir} />
                      </th>
                      <th className={thCls} onClick={() => toggleSort('submittedAt')}>
                        Submitted <SortIcon col="submittedAt" sortKey={sortKey} sortDir={sortDir} />
                      </th>
                      <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {paginated.map((row) => {
                      const atLimit = row.resetCount >= MAX_RESETS;
                      return (
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
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                type="button"
                                variant="secondary"
                                disabled={atLimit}
                                title={atLimit ? `Reset limit reached (${MAX_RESETS} resets used)` : undefined}
                                onClick={() => openResetModal(row)}
                                className="flex items-center gap-1.5"
                              >
                                <RotateCcw className="h-3 w-3" />
                                Reset
                              </Button>
                              {row.resetCount > 0 && (
                                <span className={`text-xs ${atLimit ? 'text-rose-500 font-semibold' : 'text-slate-400'}`}>
                                  {row.resetCount}/{MAX_RESETS}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {paginated.length === 0 && (
                  <p className="py-6 text-center text-sm text-slate-400">No results match your filter.</p>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                  <p className="text-xs text-slate-400">
                    {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    <span className="px-2 text-xs text-slate-600">{page} / {totalPages}</span>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={page === totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Reset reason modal */}
      {pendingReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <p className="font-semibold text-slate-900">Reset quiz for {pendingReset.member}</p>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-700">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleResetSubmit} className="p-5 space-y-4">
              <input type="hidden" name="attempt_id" value={pendingReset.attemptId} />
              <input type="hidden" name="project_id" value={projectId} />
              <input type="hidden" name="user_id" value={pendingReset.userId} />
              {adminId && <input type="hidden" name="reset_by" value={adminId} />}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Reason for reset <span className="text-rose-500">*</span>
                </label>
                <textarea
                  name="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  rows={3}
                  placeholder="e.g. Technical issue during submission, admin approved retry…"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-300"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={closeModal} disabled={isPending}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending || !reason.trim()}>
                  {isPending ? 'Resetting…' : 'Confirm reset'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
