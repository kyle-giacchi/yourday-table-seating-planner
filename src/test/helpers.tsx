import React from 'react';
import type { Guest, Table, SeatingData } from '@/types/seating';
import { MemoryRouter } from 'react-router-dom';
import { AppDataProvider } from '@/contexts/AppDataProvider';
import { ColorThemeProvider } from '@/contexts/ColorThemeProvider';
import { MealOptionsProvider } from '@/contexts/MealOptionsProvider';
import { SeatingDataProvider } from '@/contexts/SeatingDataProvider';
import { UndoProvider } from '@/contexts/UndoProvider';
import { UIStateProvider } from '@/contexts/UIStateProvider';
import { RoomProvider } from '@/contexts/RoomProvider';

let counter = 0;
const nextId = () => `test-${++counter}`;

export const createMockGuest = (overrides: Partial<Guest> = {}): Guest => ({
  id: nextId(),
  fullName: 'Jane Doe',
  firstName: 'Jane',
  lastName: 'Doe',
  mealSelection: 'Chicken',
  party: 'Doe Family',
  ...overrides,
});

export const createMockTable = (overrides: Partial<Table> = {}): Table => ({
  id: nextId(),
  x: 100,
  y: 100,
  shape: 'round',
  capacity: 8,
  guests: [],
  name: 'Table 1',
  tableNumber: 1,
  tableSize: '60" diameter',
  commonUse: 'Standard banquet, weddings',
  defaultChairs: 8,
  maxChairs: 10,
  ...overrides,
});

export const createMockSeatingData = (overrides: Partial<SeatingData> = {}): SeatingData => ({
  tables: [],
  unassignedGuests: [],
  ...overrides,
});

export const TestProviders = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>
    <AppDataProvider>
      <ColorThemeProvider>
        <MealOptionsProvider>
          <SeatingDataProvider>
            <UndoProvider>
              <UIStateProvider>
                <RoomProvider>{children}</RoomProvider>
              </UIStateProvider>
            </UndoProvider>
          </SeatingDataProvider>
        </MealOptionsProvider>
      </ColorThemeProvider>
    </AppDataProvider>
  </MemoryRouter>
);
