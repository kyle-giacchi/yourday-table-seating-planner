import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, UsersRound } from 'lucide-react';
import type { PartyGroup } from '@/utils/summaryViewModel';
import { mealHex } from './mealColors';

interface Props {
  parties: PartyGroup[];
}

const COLLAPSED_LIMIT = 6;

const PartyRow = ({ party }: { party: PartyGroup }) => (
  <li className="border-border bg-card rounded-lg border px-4 py-3">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-foreground truncate text-sm font-semibold">{party.name}</p>
        <p className="text-muted-foreground mt-0.5 text-xs">
          {party.guestCount} guest{party.guestCount === 1 ? '' : 's'}
          {party.tableNames.length > 0 && (
            <>
              {' · '}
              {party.tableNames.length === 1
                ? party.tableNames[0]
                : `${party.tableNames.length} tables`}
            </>
          )}
          {party.unassignedCount > 0 && (
            <span className="text-destructive">
              {' · '}
              {party.unassignedCount} unseated
            </span>
          )}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1" aria-label="meal breakdown">
        {party.meals.map((m) => (
          <span
            key={m.mealType}
            title={`${m.mealType}: ${m.count}`}
            className="bg-muted/50 text-foreground flex h-6 items-center gap-1 rounded-full px-2 text-xs tabular-nums"
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: mealHex(m.mealType) }}
              aria-hidden="true"
            />
            {m.count}
          </span>
        ))}
      </div>
    </div>
  </li>
);

export const PartiesCard = ({ parties }: Props) => {
  const [expanded, setExpanded] = useState(false);
  // Tracks whether the print-driven auto-expand is responsible for the
  // current expanded state. If the user manually expanded before printing,
  // we leave it expanded after the print dialog closes.
  const autoExpandedForPrintRef = useRef(false);

  useEffect(() => {
    const handleBeforePrint = () => {
      setExpanded((current) => {
        if (!current) {
          autoExpandedForPrintRef.current = true;
          return true;
        }
        return current;
      });
    };
    const handleAfterPrint = () => {
      if (autoExpandedForPrintRef.current) {
        autoExpandedForPrintRef.current = false;
        setExpanded(false);
      }
    };
    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  if (parties.length === 0) return null;

  const visible = expanded ? parties : parties.slice(0, COLLAPSED_LIMIT);
  const hiddenCount = parties.length - visible.length;

  return (
    <section
      aria-labelledby="parties-heading"
      className="border-border bg-card rounded-xl border p-6 shadow-xs"
    >
      <header className="mb-4 flex items-center gap-2">
        <UsersRound className="text-muted-foreground h-4 w-4" aria-hidden="true" />
        <h2 id="parties-heading" className="text-foreground text-lg font-semibold">
          Parties &amp; Groups
        </h2>
        <span className="text-muted-foreground ml-auto text-xs">
          {parties.length} part{parties.length === 1 ? 'y' : 'ies'}
        </span>
      </header>

      <ul className="space-y-2">
        {visible.map((party) => (
          <PartyRow key={party.name} party={party} />
        ))}
      </ul>

      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => {
            autoExpandedForPrintRef.current = false;
            setExpanded(true);
          }}
          className="text-primary hover:bg-primary/5 mt-3 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium print:hidden"
        >
          Show {hiddenCount} more
          <ChevronDown className="h-3 w-3" aria-hidden="true" />
        </button>
      )}
    </section>
  );
};
