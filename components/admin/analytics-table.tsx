'use client';

import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { toCsv } from '@/lib/utils';

export function AnalyticsTable({
  title,
  rows,
}: {
  title: string;
  rows: Array<Record<string, string | number>>;
}) {
  const [filter, setFilter] = useState('');
  const columns = useMemo(() => Object.keys(rows[0] ?? {}), [rows]);
  const filteredRows = useMemo(() => {
    if (!filter) {
      return rows;
    }

    return rows.filter((row) => Object.values(row).some((value) => String(value).toLowerCase().includes(filter.toLowerCase())));
  }, [filter, rows]);

  const exportCsv = () => {
    const blob = new Blob([toCsv(filteredRows)], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${title.toLowerCase().replaceAll(' ', '-')}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <CardTitle>{title}</CardTitle>
        <div className="flex gap-3">
          <input
            className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm"
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Filter rows"
            value={filter}
          />
          <Button onClick={exportCsv} type="button" variant="secondary">
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <THead>
            <TR>
              {columns.map((column) => (
                <TH key={column}>{column}</TH>
              ))}
            </TR>
          </THead>
          <TBody>
            {filteredRows.map((row, rowIndex) => (
              <TR key={rowIndex}>
                {columns.map((column) => (
                  <TD key={column}>{String(row[column])}</TD>
                ))}
              </TR>
            ))}
          </TBody>
        </Table>
      </CardContent>
    </Card>
  );
}