import React from 'react';
import { Table2 } from 'lucide-react';
import type { BanquetSummaryData } from '@/types/banquet';

interface Props {
  tableTypeSummary: BanquetSummaryData['tableTypeSummary'];
  totalTables: number;
}

export const TableMixCard = ({ tableTypeSummary, totalTables }: Props) => {
  const maxCount = Math.max(1, ...tableTypeSummary.map((t) => t.count));
  return (
    <section
      aria-labelledby="table-mix-heading"
      className="border-border bg-card rounded-xl border p-6 shadow-xs"
    >
      <header className="mb-4 flex items-center gap-2">
        <Table2 className="text-muted-foreground h-4 w-4" aria-hidden="true" />
        <h2 id="table-mix-heading" className="text-foreground text-lg font-semibold">
          Table Mix
        </h2>
        <span className="text-muted-foreground ml-auto text-xs">
          {totalTables} table{totalTables === 1 ? '' : 's'}
        </span>
      </header>
      {tableTypeSummary.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">No tables placed yet.</p>
      ) : (
        <ul className="space-y-3">
          {tableTypeSummary.map((type) => {
            const widthPct = Math.max(6, Math.round((type.count / maxCount) * 100));
            return (
              <li key={type.type}>
                <div className="mb-1 flex items-baseline justify-between gap-3">
                  <span className="text-foreground truncate text-sm font-medium">{type.type}</span>
                  <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                    <span className="text-foreground font-semibold">{type.count}</span> ·{' '}
                    {type.totalSeats} seats
                  </span>
                </div>
                <div className="bg-muted h-2 overflow-hidden rounded-full">
                  <div
                    className="bg-primary/80 h-full rounded-full"
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
