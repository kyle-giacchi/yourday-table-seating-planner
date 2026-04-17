import { useState, useRef, useCallback } from 'react';
import { useSeatingData } from '@/contexts/SeatingDataContext';
import { useUndo } from '@/contexts/UndoContext';
import { checkCapacityStatus, CapacityStatus } from '@/lib/capacityChecker';
import type { CapacityCheckResult } from '@/lib/capacityChecker';
import { useToast } from '@/hooks/use-toast';

interface CapacityModalData {
  type: 'guest' | 'party';
  guestId?: string;
  partyName?: string;
  tableId: string;
  tableName: string;
  currentCount: number;
  newCount: number;
  defaultCapacity: number;
  maxCapacity: number;
}

interface CapacityModalState {
  isOpen: boolean;
  data?: CapacityModalData;
}

type ResolveFn = (value: boolean) => void;

/** Build the modal data object from a capacity check result and an assignment request. */
const buildModalData = (
  req: {
    type: 'guest' | 'party';
    guestId?: string;
    partyName?: string;
    tableId: string;
    tableName: string;
  },
  capacity: CapacityCheckResult,
): CapacityModalData => ({
  ...req,
  currentCount: capacity.currentCount,
  newCount: capacity.newCount,
  defaultCapacity: capacity.defaultCapacity,
  maxCapacity: capacity.maxCapacity,
});

type ToastFn = ReturnType<typeof useToast>['toast'];

interface AssignGuestDeps {
  tables: Array<{
    id: string;
    name: string;
    maxChairs: number;
    defaultChairs: number;
    guests: Array<{ id: string; party?: string }>;
  }>;
  assignGuestToTable: (guestId: string, tableId: string) => void;
  promptConfirm: (data: CapacityModalData) => Promise<boolean>;
  toast: ToastFn;
}

const runAssignGuestWithCapacityCheck = async (
  guestId: string,
  tableId: string,
  deps: AssignGuestDeps,
): Promise<boolean> => {
  const table = deps.tables.find((t) => t.id === tableId);
  if (!table) return false;

  // Guard: silently no-op if guest is already seated at this table (e.g. dragging back onto source)
  if (table.guests.some((g) => g.id === guestId)) return false;

  const capacity = checkCapacityStatus(table as never, 1);

  if (capacity.status === CapacityStatus.WITHIN_DEFAULT) {
    deps.assignGuestToTable(guestId, tableId);
    deps.toast({ title: 'Guest assigned successfully', description: `Added to ${table.name}` });
    return true;
  }
  if (capacity.status === CapacityStatus.EXCEEDS_DEFAULT) {
    return deps.promptConfirm(
      buildModalData({ type: 'guest', guestId, tableId, tableName: table.name }, capacity),
    );
  }
  if (capacity.status === CapacityStatus.EXCEEDS_MAXIMUM) {
    deps.toast({
      title: 'Exceeds maximum seat limit',
      description: `${table.name} cannot accommodate more guests (max: ${table.maxChairs})`,
      variant: 'destructive',
    });
  }
  return false;
};

interface AssignPartyDeps {
  tables: AssignGuestDeps['tables'];
  unassignedGuests: Array<{ party?: string }>;
  assignPartyToTable: (partyName: string, tableId: string) => void;
  promptConfirm: (data: CapacityModalData) => Promise<boolean>;
  toast: ToastFn;
}

const runAssignPartyWithCapacityCheck = async (
  partyName: string,
  tableId: string,
  deps: AssignPartyDeps,
): Promise<boolean> => {
  const table = deps.tables.find((t) => t.id === tableId);
  if (!table) {
    console.error('useTableAssignment - Table not found:', tableId);
    return false;
  }

  // Guard: silently no-op if this party already has members at this table (dragging back onto source)
  if (table.guests.some((g) => g.party === partyName)) return false;

  const partySize = deps.unassignedGuests.filter((g) => g.party === partyName).length;
  if (partySize === 0) return false;

  const capacity = checkCapacityStatus(table as never, partySize);

  if (capacity.status === CapacityStatus.WITHIN_DEFAULT) {
    deps.assignPartyToTable(partyName, tableId);
    deps.toast({
      title: 'Party assigned successfully',
      description: `${partyName} (${partySize} guests) added to ${table.name}`,
    });
    return true;
  }
  if (capacity.status === CapacityStatus.EXCEEDS_DEFAULT) {
    return deps.promptConfirm(
      buildModalData({ type: 'party', partyName, tableId, tableName: table.name }, capacity),
    );
  }
  if (capacity.status === CapacityStatus.EXCEEDS_MAXIMUM) {
    deps.toast({
      title: 'Exceeds maximum seat limit',
      description: `${partyName} (${partySize} guests) cannot fit at ${table.name} (max: ${table.maxChairs})`,
      variant: 'destructive',
    });
  }
  return false;
};

interface ConfirmDeps {
  assignGuestToTable: (guestId: string, tableId: string) => void;
  assignPartyToTable: (partyName: string, tableId: string) => void;
  toast: ToastFn;
}

const runCapacityConfirm = (data: CapacityModalData, deps: ConfirmDeps): void => {
  if (data.type === 'guest' && data.guestId) {
    deps.assignGuestToTable(data.guestId, data.tableId);
    deps.toast({
      title: 'Guest assigned',
      description: `Added to ${data.tableName} (${data.newCount}/${data.maxCapacity} seats)`,
    });
    return;
  }
  if (data.type === 'party' && data.partyName) {
    deps.assignPartyToTable(data.partyName, data.tableId);
    const partySize = data.newCount - data.currentCount;
    deps.toast({
      title: 'Party assigned',
      description: `${data.partyName} (${partySize} guests) added to ${data.tableName}`,
    });
  }
};

export const useTableAssignment = () => {
  const {
    seatingData,
    assignGuestToTable,
    assignPartyToTable,
    removeGuestFromTable,
    removePartyFromTable,
  } = useSeatingData();
  const { toast } = useToast();
  const { lastAssignment, setLastAssignment } = useUndo();
  const resolveRef = useRef<ResolveFn | null>(null);
  const [capacityModal, setCapacityModal] = useState<CapacityModalState>({ isOpen: false });

  const promptConfirm = (data: CapacityModalData): Promise<boolean> =>
    new Promise((resolve) => {
      setCapacityModal({ isOpen: true, data });
      resolveRef.current = resolve;
    });

  const assignGuestWithCapacityCheck = async (guestId: string, tableId: string) => {
    const ok = await runAssignGuestWithCapacityCheck(guestId, tableId, {
      tables: seatingData.tables as never,
      assignGuestToTable,
      promptConfirm,
      toast,
    });
    if (ok) {
      const table = seatingData.tables.find((t) => t.id === tableId);
      setLastAssignment({
        type: 'guest',
        guestId,
        tableId,
        tableName: table?.name ?? 'table',
      });
    }
    return ok;
  };

  const assignPartyWithCapacityCheck = async (partyName: string, tableId: string) => {
    const ok = await runAssignPartyWithCapacityCheck(partyName, tableId, {
      tables: seatingData.tables as never,
      unassignedGuests: seatingData.unassignedGuests,
      assignPartyToTable,
      promptConfirm,
      toast,
    });
    if (ok) {
      const table = seatingData.tables.find((t) => t.id === tableId);
      setLastAssignment({
        type: 'party',
        partyName,
        tableId,
        tableName: table?.name ?? 'table',
      });
    }
    return ok;
  };

  const handleCapacityConfirm = () => {
    const { data } = capacityModal;
    if (data) {
      runCapacityConfirm(data, { assignGuestToTable, assignPartyToTable, toast });
      if (data.type === 'guest' && data.guestId) {
        setLastAssignment({
          type: 'guest',
          guestId: data.guestId,
          tableId: data.tableId,
          tableName: data.tableName,
        });
      } else if (data.type === 'party' && data.partyName) {
        setLastAssignment({
          type: 'party',
          partyName: data.partyName,
          tableId: data.tableId,
          tableName: data.tableName,
        });
      }
    }
    resolveRef.current?.(true);
    resolveRef.current = null;
    setCapacityModal({ isOpen: false });
  };

  const handleCapacityCancel = () => {
    resolveRef.current?.(false);
    resolveRef.current = null;
    setCapacityModal({ isOpen: false });
  };

  const undoLastAssignment = useCallback(() => {
    if (!lastAssignment) return;
    if (lastAssignment.type === 'guest') {
      removeGuestFromTable(lastAssignment.guestId);
      toast({
        title: 'Undid last assignment',
        description: `Removed guest from ${lastAssignment.tableName}`,
      });
    } else {
      removePartyFromTable(lastAssignment.partyName, lastAssignment.tableId);
      toast({
        title: 'Undid last assignment',
        description: `Removed ${lastAssignment.partyName} from ${lastAssignment.tableName}`,
      });
    }
    setLastAssignment(null);
  }, [lastAssignment, removeGuestFromTable, removePartyFromTable, toast, setLastAssignment]);

  return {
    assignGuestWithCapacityCheck,
    assignPartyWithCapacityCheck,
    capacityModal: {
      ...capacityModal,
      onConfirm: handleCapacityConfirm,
      onCancel: handleCapacityCancel,
    },
    lastAssignment,
    undoLastAssignment,
  };
};
