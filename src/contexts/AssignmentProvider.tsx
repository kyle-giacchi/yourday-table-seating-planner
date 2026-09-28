import React, { useRef, useState } from 'react';
import { useSeatingData } from '@/contexts/SeatingDataContext';
import { toast } from '@/hooks/use-toast';
import { TableAssignmentContext, type LastAssignment } from '@/hooks/useTableAssignment';
import { CapacityModal } from '@/components/common/CapacityModal';
import { CapacityStatus } from '@/lib/capacityChecker';
import { parseDragData, type DragData } from '@/types/dragDrop';
import { planAssignment, type AssignmentPlan } from '@/utils/seatingModel';

const describeMove = (data: DragData, plan: AssignmentPlan, guestName: string | undefined) =>
  data.type === 'party'
    ? `${data.partyName} (${plan.guestIds.length} guests)`
    : (guestName ?? 'Guest');

/**
 * Owns guest/party → table assignment for the whole app: one capacity-confirm
 * modal, one undo slot. Every drop site and assign menu goes through `assign`.
 */
export const AssignmentProvider = ({ children }: { children: React.ReactNode }) => {
  const { seatingData, moveGuests } = useSeatingData();
  const [lastAssignment, setLastAssignment] = useState<LastAssignment | null>(null);
  const [pendingPlan, setPendingPlan] = useState<AssignmentPlan | null>(null);
  const resolveRef = useRef<((ok: boolean) => void) | null>(null);

  const settleConfirm = (ok: boolean) => {
    resolveRef.current?.(ok);
    resolveRef.current = null;
    setPendingPlan(null);
  };

  const confirmOverDefault = (plan: AssignmentPlan) =>
    new Promise<boolean>((resolve) => {
      resolveRef.current?.(false); // a newer request supersedes an unanswered one
      resolveRef.current = resolve;
      setPendingPlan(plan);
    });

  const assign = async (data: DragData, tableId: string): Promise<boolean> => {
    const plan = planAssignment(seatingData, data, tableId);
    if (!plan) return false;
    const { table, guestIds, capacity } = plan;
    const guestName = [
      ...seatingData.unassignedGuests,
      ...seatingData.tables.flatMap((t) => t.guests),
    ].find((g) => g.id === guestIds[0])?.fullName;
    const label = describeMove(data, plan, guestName);
    const fromTableId =
      seatingData.tables.find((t) => t.guests.some((g) => g.id === guestIds[0]))?.id ?? null;

    if (capacity.status === CapacityStatus.EXCEEDS_MAXIMUM) {
      toast({
        title: 'Exceeds maximum seat limit',
        description: `${label} cannot fit at ${table.name} (max: ${table.maxChairs})`,
        variant: 'destructive',
      });
      return false;
    }
    if (capacity.status === CapacityStatus.EXCEEDS_DEFAULT && !(await confirmOverDefault(plan))) {
      return false;
    }

    moveGuests(guestIds, tableId);
    setLastAssignment({ guestIds, fromTableId, label, tableName: table.name });
    const seats =
      capacity.status === CapacityStatus.EXCEEDS_DEFAULT
        ? ` (${capacity.newCount}/${capacity.maxCapacity} seats)`
        : '';
    toast({
      title: data.type === 'party' ? 'Party assigned' : 'Guest assigned',
      description: `${label} added to ${table.name}${seats}`,
    });
    return true;
  };

  const dropOnTable = (e: React.DragEvent, tableId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const data = parseDragData(e.dataTransfer.getData('application/json'));
    return data ? assign(data, tableId) : Promise.resolve(false);
  };

  const undoLastAssignment = () => {
    if (!lastAssignment) return;
    moveGuests(lastAssignment.guestIds, lastAssignment.fromTableId);
    toast({
      title: 'Undid last assignment',
      description: `Removed ${lastAssignment.label} from ${lastAssignment.tableName}`,
    });
    setLastAssignment(null);
  };

  return (
    <TableAssignmentContext.Provider
      value={{ assign, dropOnTable, lastAssignment, undoLastAssignment }}
    >
      {children}
      {pendingPlan && (
        <CapacityModal
          isOpen
          onClose={() => settleConfirm(false)}
          onConfirm={() => settleConfirm(true)}
          tableName={pendingPlan.table.name}
          currentCount={pendingPlan.capacity.currentCount}
          newCount={pendingPlan.capacity.newCount}
          defaultCapacity={pendingPlan.capacity.defaultCapacity}
          maxCapacity={pendingPlan.capacity.maxCapacity}
        />
      )}
    </TableAssignmentContext.Provider>
  );
};
