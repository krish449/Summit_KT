'use client';

import { CheckCircle2 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPercent } from '@/lib/utils';

export function ResultSummary({
  score,
  totalMarks,
  percentage,
}: {
  score: number;
  totalMarks: number;
  percentage: number;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          <CardTitle>Quiz submitted</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end gap-4">
          <p className="text-5xl font-bold tracking-tight text-slate-950">
            {score}
            <span className="text-2xl font-medium text-slate-400">/{totalMarks}</span>
          </p>
          <p className="mb-1 text-2xl font-semibold text-slate-600">{formatPercent(percentage)}</p>
        </div>
        <p className="text-sm text-slate-500">
          Your score has been recorded. Your admin will review the results.
        </p>
      </CardContent>
    </Card>
  );
}
