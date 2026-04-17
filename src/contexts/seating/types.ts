import type { MutableRefObject } from 'react';
import type { Table, Guest } from '@/types/seating';

export interface EntityRefs {
  tablesRef: MutableRefObject<Table[]>;
  guestsRef: MutableRefObject<Guest[]>;
}

export interface EntityDispatchers {
  addTableEntity: (table: Table) => void;
  updateTableEntity: (id: string, update: Partial<Table> | ((t: Table) => Table)) => void;
  removeTableEntity: (id: string) => void;
  setTableEntities: (tables: Table[]) => void;
  addGuestEntity: (guest: Guest) => void;
  updateGuestEntity: (id: string, update: Partial<Guest>) => void;
  removeGuestEntity: (id: string) => void;
  setGuestEntities: (guests: Guest[]) => void;
}
