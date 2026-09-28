import { createContext, useContext } from 'react';
import type { Table, Guest, SeatingData, RoomAsset } from '@/types/seating';

export interface SeatingDataContextType {
  seatingData: SeatingData;
  addTable: (table: Omit<Table, 'id' | 'name' | 'tableNumber'>) => void;
  addTables: (tables: Omit<Table, 'id' | 'name' | 'tableNumber'>[]) => void;
  updateTable: (id: string, updates: Partial<Table> | ((table: Table) => Partial<Table>)) => void;
  removeTable: (id: string) => void;
  addGuest: (guest: Omit<Guest, 'id'> | Guest) => void;
  updateGuest: (id: string, updates: Partial<Guest>) => void;
  removeGuest: (id: string) => void;
  /** Move guests (from anywhere) onto a table, or to unassigned when `toTableId` is null. */
  moveGuests: (guestIds: string[], toTableId: string | null) => void;
  removeGuestFromTable: (guestId: string) => void;
  removePartyFromTable: (partyName: string, tableId: string) => void;
  reorderGuestInTable: (tableId: string, guestId: string, newIndex: number) => void;
  reorderPartyInTable: (tableId: string, partyName: string, targetIndex: number) => void;
  /** Replace current guests/tables with the opt-in demo data set (Index page CTA). */
  loadDemoData: () => void;
  assets: RoomAsset[];
  addAsset: (asset: Omit<RoomAsset, 'id'>) => void;
  updateAsset: (id: string, updates: Partial<RoomAsset>) => void;
  removeAsset: (id: string) => void;
}

export const SeatingDataContext = createContext<SeatingDataContextType | undefined>(undefined);

export const useSeatingData = () => {
  const context = useContext(SeatingDataContext);
  if (!context) {
    throw new Error('useSeatingData must be used within a SeatingDataProvider');
  }
  return context;
};
