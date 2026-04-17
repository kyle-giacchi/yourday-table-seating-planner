import { createContext, useContext } from 'react';

export type LastAssignment =
  | { type: 'guest'; guestId: string; tableId: string; tableName: string }
  | { type: 'party'; partyName: string; tableId: string; tableName: string };

export interface UndoContextType {
  lastAssignment: LastAssignment | null;
  setLastAssignment: (a: LastAssignment | null) => void;
}

export const UndoContext = createContext<UndoContextType | undefined>(undefined);

export const useUndo = (): UndoContextType => {
  const ctx = useContext(UndoContext);
  if (!ctx) throw new Error('useUndo must be used within an UndoProvider');
  return ctx;
};
