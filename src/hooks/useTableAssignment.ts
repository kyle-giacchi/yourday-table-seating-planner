import { createContext, useContext } from 'react';
import type { DragData } from '@/types/dragDrop';

/** Enough to reverse the last assignment: who moved, and where they came from. */
export interface LastAssignment {
  guestIds: string[];
  /** Table they were on before, or null if they came from the unassigned list. */
  fromTableId: string | null;
  label: string;
  tableName: string;
}

export interface TableAssignmentContextType {
  /**
   * The one way to put a guest or party on a table. Applies capacity rules,
   * asks for confirmation over the default seat count, toasts, records undo.
   * Resolves true when guests actually moved.
   */
  assign: (data: DragData, tableId: string) => Promise<boolean>;
  /** Read the drag payload off a drop event and `assign` it. */
  dropOnTable: (e: React.DragEvent, tableId: string) => Promise<boolean>;
  lastAssignment: LastAssignment | null;
  undoLastAssignment: () => void;
}

export const TableAssignmentContext = createContext<TableAssignmentContextType | undefined>(
  undefined,
);

export const useTableAssignment = (): TableAssignmentContextType => {
  const ctx = useContext(TableAssignmentContext);
  if (!ctx) throw new Error('useTableAssignment must be used within an AssignmentProvider');
  return ctx;
};
