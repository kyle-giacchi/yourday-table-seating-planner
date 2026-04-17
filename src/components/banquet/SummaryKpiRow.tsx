import React from 'react';
import { Users, Table2, Armchair, UsersRound, Utensils } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { SummaryViewModel } from '@/utils/summaryViewModel';

interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  progress?: number;
  accentClass?: string;
}

const KpiCard = ({
  icon: Icon,
  label,
  value,
  sub,
  progress,
  accentClass = 'text-primary bg-primary/10',
}: KpiCardProps) => (
  <div className="group border-border bg-card rounded-xl border p-5 shadow-xs transition-shadow hover:shadow-md">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</p>
        <p className="text-foreground mt-1 text-3xl font-bold tabular-nums">{value}</p>
        {sub && <p className="text-muted-foreground mt-1 text-xs">{sub}</p>}
      </div>
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${accentClass}`}
        aria-hidden="true"
      >
        <Icon className="h-5 w-5" />
      </div>
    </div>
    {progress !== undefined && (
      <div className="mt-3">
        <div
          className="bg-muted h-1.5 w-full overflow-hidden rounded-full"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label}
        >
          <div
            className="bg-primary h-full rounded-full transition-[width] duration-500"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      </div>
    )}
  </div>
);

export const SummaryKpiRow = ({ vm }: { vm: SummaryViewModel }) => {
  const {
    summary,
    utilization,
    parties,
    splitPartyCount,
    mealCompletionPercentage,
    tablesInUse,
    emptyTables,
  } = vm;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <KpiCard
        icon={Users}
        label="Total Guests"
        value={summary.totalGuests.toString()}
        sub={`${summary.assignedGuests} seated · ${summary.unassignedGuests} unseated`}
      />
      <KpiCard
        icon={Table2}
        label="Tables in Use"
        value={tablesInUse.toString()}
        sub={`of ${summary.totalTables} total · ${emptyTables} empty`}
      />
      <KpiCard
        icon={Armchair}
        label="Empty Seats"
        value={utilization.emptySeats.toString()}
        sub={
          emptyTables > 0
            ? `${emptyTables} empty table${emptyTables === 1 ? '' : 's'}`
            : 'all tables have guests'
        }
      />
      <KpiCard
        icon={UsersRound}
        label="Parties"
        value={parties.length.toString()}
        sub={
          splitPartyCount > 0
            ? `${splitPartyCount} split across 2+ tables`
            : parties.length > 0
              ? 'all parties seated together'
              : 'no parties yet'
        }
      />
      <KpiCard
        icon={Utensils}
        label="Meals Selected"
        value={`${mealCompletionPercentage}%`}
        sub={`${summary.totalGuests - (summary.foodSummary.find((f) => f.mealType === 'Unassigned')?.count ?? 0)} of ${summary.totalGuests} guests`}
        progress={mealCompletionPercentage}
      />
    </div>
  );
};
