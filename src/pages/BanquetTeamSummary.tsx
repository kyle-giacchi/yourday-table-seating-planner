import React, { useMemo, useState } from 'react';
import { DemoSummaryGate } from '@/components/banquet/DemoSummaryGate';
import { safeLocalStorage } from '@/lib/safeStorage';
import { DEMO_SUMMARY_UNLOCKED_KEY } from '@/lib/storageKeys';
import { ExportActions } from '@/components/banquet/ExportActions';
import { SummaryAlertStrip } from '@/components/banquet/SummaryAlertStrip';
import { SummaryKpiRow } from '@/components/banquet/SummaryKpiRow';
import { MealDistributionCard } from '@/components/banquet/MealDistributionCard';
import { TableMixCard } from '@/components/banquet/TableMixCard';
import { PartiesCard } from '@/components/banquet/PartiesCard';
import { TableCardGrid } from '@/components/banquet/TableCardGrid';
import { buildSummaryViewModel } from '@/utils/summaryViewModel';
import { useSeating } from '@/hooks/useSeating';

const EmptyState = () => (
  <div className="flex min-h-[60vh] flex-col items-center justify-center gap-2 px-6 text-center">
    <p className="text-foreground text-xl font-semibold">No event data yet</p>
    <p className="text-muted-foreground max-w-md text-sm">
      Add tables and guests on the Layout page and your event summary will appear here.
    </p>
  </div>
);

const SummaryHeader = ({ vm }: { vm: ReturnType<typeof buildSummaryViewModel> }) => {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold">Banquet Team Summary</h1>
      </div>
      <div className="print:hidden">
        <ExportActions vm={vm} />
      </div>
    </header>
  );
};

const PaidSummaryContent = () => {
  const { seatingData } = useSeating();
  const vm = useMemo(
    () => buildSummaryViewModel(seatingData.tables, seatingData.unassignedGuests),
    [seatingData.tables, seatingData.unassignedGuests],
  );

  if (vm.summary.totalTables === 0 && vm.summary.totalGuests === 0) {
    return (
      <div className="bg-muted/30 flex h-[calc(100vh-4rem)] flex-col overflow-y-auto">
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="bg-muted/30 print:bg-background flex h-[calc(100vh-4rem)] flex-col overflow-y-auto print:h-auto print:overflow-visible">
      <div className="container mx-auto space-y-6 px-4 py-8 print:max-w-none print:px-0 print:py-4">
        <SummaryHeader vm={vm} />

        {vm.alerts.length > 0 && <SummaryAlertStrip alerts={vm.alerts} />}

        <SummaryKpiRow vm={vm} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <MealDistributionCard
            foodSummary={vm.summary.foodSummary}
            totalGuests={vm.summary.totalGuests}
          />
          <TableMixCard
            tableTypeSummary={vm.summary.tableTypeSummary}
            totalTables={vm.summary.totalTables}
          />
        </div>

        <PartiesCard parties={vm.parties} />

        <TableCardGrid
          assignments={vm.summary.tableAssignments}
          extraSeatTables={vm.summary.extraSeatTables}
          emptyTables={vm.emptyTables}
        />
      </div>
    </div>
  );
};

const BanquetTeamSummary = () => {
  const [unlocked, setUnlocked] = useState(
    () => safeLocalStorage.getItem(DEMO_SUMMARY_UNLOCKED_KEY) === 'true',
  );

  if (!unlocked) {
    return <DemoSummaryGate onUnlock={() => setUnlocked(true)} />;
  }

  return <PaidSummaryContent />;
};

export default BanquetTeamSummary;
