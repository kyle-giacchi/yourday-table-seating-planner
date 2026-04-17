import React from 'react';
import { Armchair, AlertTriangle, Crown, AlertOctagon } from 'lucide-react';
import type { BanquetSummaryData } from '@/types/banquet';
import { mealHex } from './mealColors';

type TableAssignment = BanquetSummaryData['tableAssignments'][number];
type ExtraSeatMap = Record<number, BanquetSummaryData['extraSeatTables'][number]>;

interface Props {
  assignments: TableAssignment[];
  extraSeatTables: BanquetSummaryData['extraSeatTables'];
  emptyTables: number;
}

const buildExtraMap = (rows: BanquetSummaryData['extraSeatTables']): ExtraSeatMap =>
  Object.fromEntries(rows.map((row) => [row.tableNumber, row]));

const buildMealTally = (
  guests: TableAssignment['guests'],
): Array<{ mealType: string; count: number }> => {
  const counts = new Map<string, number>();
  for (const g of guests) {
    counts.set(g.mealSelection, (counts.get(g.mealSelection) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([mealType, count]) => ({ mealType, count }))
    .sort((a, b) => b.count - a.count);
};

const GuestRow = ({ guest }: { guest: TableAssignment['guests'][number] }) => {
  const isUnassigned = guest.mealSelection === 'Unassigned';
  const hasAllergy = (guest.allergyFlags?.length ?? 0) > 0;
  return (
    <li className="flex items-center justify-between gap-2 py-1.5">
      <span className="flex min-w-0 items-center gap-2">
        <span className="text-foreground truncate text-sm">{guest.name}</span>
        {hasAllergy && (
          <span
            title={
              guest.dietaryNotes
                ? `${guest.allergyFlags?.join(', ')} — ${guest.dietaryNotes}`
                : guest.allergyFlags?.join(', ')
            }
            className="bg-destructive/15 text-destructive inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
          >
            <AlertOctagon className="h-2.5 w-2.5" aria-hidden="true" />
            Allergy
          </span>
        )}
      </span>
      <span
        className={`flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-xs whitespace-nowrap ${
          isUnassigned ? 'bg-destructive/10 text-destructive' : 'bg-muted text-foreground'
        }`}
      >
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: mealHex(guest.mealSelection) }}
          aria-hidden="true"
        />
        {guest.mealSelection}
      </span>
    </li>
  );
};

const MealTally = ({ guests }: { guests: TableAssignment['guests'] }) => {
  const tally = buildMealTally(guests);
  return (
    <div className="flex flex-wrap items-center gap-1.5" aria-label="meal breakdown">
      {tally.map((item) => (
        <span
          key={item.mealType}
          className="bg-muted/50 text-foreground inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] tabular-nums"
          title={`${item.mealType}: ${item.count}`}
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: mealHex(item.mealType) }}
            aria-hidden="true"
          />
          <span className="text-muted-foreground">{item.mealType}</span>
          <span className="font-semibold">×{item.count}</span>
        </span>
      ))}
    </div>
  );
};

const TableCard = ({
  assignment,
  extra,
}: {
  assignment: TableAssignment;
  extra?: ExtraSeatMap[number];
}) => {
  const guestCount = assignment.guests.length;
  return (
    <article
      className={`bg-card break-inside-avoid rounded-xl border shadow-xs ${
        assignment.isHeadTable ? 'border-warning/40 ring-warning/20 ring-2' : 'border-border'
      }`}
    >
      {assignment.isHeadTable && (
        <div className="bg-warning/15 text-warning flex items-center gap-1.5 rounded-t-xl px-4 py-1.5 text-[11px] font-bold tracking-wider uppercase">
          <Crown className="h-3 w-3" aria-hidden="true" />
          Head Table
        </div>
      )}
      <header className="border-border/60 flex flex-col gap-2 border-b px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-foreground truncate text-sm font-semibold">
              {assignment.tableName}
            </h3>
            <p className="text-muted-foreground mt-0.5 flex items-center gap-1 text-xs">
              <Armchair className="h-3 w-3" aria-hidden="true" />
              {guestCount} guest{guestCount === 1 ? '' : 's'}
              {extra && (
                <span className="bg-warning/10 text-warning ml-1 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium">
                  <AlertTriangle className="h-2.5 w-2.5" aria-hidden="true" />+{extra.extraSeats}{' '}
                  extra
                </span>
              )}
            </p>
            <p className="text-muted-foreground/70 mt-0.5 text-[11px]">
              {assignment.tableSize} {assignment.shape} · {assignment.capacity} chairs
            </p>
          </div>
        </div>
        <MealTally guests={assignment.guests} />
      </header>
      <ul className="divide-border/60 divide-y px-4 py-2">
        {assignment.guests.map((guest) => (
          <GuestRow key={guest.name} guest={guest} />
        ))}
      </ul>
    </article>
  );
};

export const TableCardGrid = ({ assignments, extraSeatTables, emptyTables }: Props) => {
  const extraMap = buildExtraMap(extraSeatTables);
  return (
    <section
      aria-labelledby="table-assignments-heading"
      className="border-border bg-card rounded-xl border p-6 shadow-xs"
    >
      <header className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="table-assignments-heading" className="text-foreground text-lg font-semibold">
          Table Assignments
        </h2>
        <p className="text-muted-foreground text-xs">
          {assignments.length} assigned · {emptyTables} empty
        </p>
      </header>

      {assignments.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">No table assignments yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {assignments.map((assignment) => (
            <TableCard
              key={assignment.tableNumber}
              assignment={assignment}
              extra={extraMap[assignment.tableNumber]}
            />
          ))}
        </div>
      )}
    </section>
  );
};
