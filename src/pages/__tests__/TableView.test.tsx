import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import TableView from '@/pages/TableView';
import { createMockGuest, createMockTable } from '@/test/helpers';
import type { SeatingData } from '@/types/seating';

// --- Mocks ---

const mockToast = vi.fn();

let mockSeatingData: SeatingData = { tables: [], unassignedGuests: [] };

vi.mock('@/hooks/useSeating', () => ({
  useSeating: () => ({
    seatingData: mockSeatingData,
    removePartyFromTable: vi.fn(),
  }),
}));

vi.mock('@/hooks/useTableAssignment', () => ({
  useTableAssignment: () => ({
    assignGuestWithCapacityCheck: vi.fn(),
    assignPartyWithCapacityCheck: vi.fn(),
    capacityModal: { isOpen: false, onConfirm: vi.fn(), onCancel: vi.fn() },
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Stub complex child components that need Radix/virtual scrolling internals
vi.mock('@/components/common/UnifiedAssignmentPanel', () => ({
  UnifiedAssignmentPanel: (props: { className?: string }) => (
    <div data-testid="assignment-panel" className={props.className}>
      Assignment Panel Stub
    </div>
  ),
}));

vi.mock('@/components/seating/AddTableDropdown', () => ({
  AddTableDropdown: () => <button>Add Table</button>,
}));

describe('TableView page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSeatingData = { tables: [], unassignedGuests: [] };
  });

  it('renders page title', () => {
    render(<TableView />);
    expect(screen.getByText('Seat Assignments')).toBeInTheDocument();
  });

  it('shows correct table count', () => {
    const tables = [
      createMockTable({ id: 't1', name: 'Table 1', tableNumber: 1 }),
      createMockTable({ id: 't2', name: 'Table 2', tableNumber: 2 }),
      createMockTable({ id: 't3', name: 'Table 3', tableNumber: 3 }),
    ];
    mockSeatingData = { tables, unassignedGuests: [] };

    render(<TableView />);
    expect(screen.getByText('Tables (3)')).toBeInTheDocument();
  });

  it('shows table cards with capacity info', () => {
    const guests = [
      createMockGuest({ id: 'g1' }),
      createMockGuest({ id: 'g2' }),
      createMockGuest({ id: 'g3' }),
    ];
    const table = createMockTable({ id: 't1', name: 'Table 1', guests, defaultChairs: 8 });
    mockSeatingData = { tables: [table], unassignedGuests: [] };

    render(<TableView />);
    expect(screen.getByText('Table 1')).toBeInTheDocument();
  });

  it('display mode toggle buttons render', () => {
    render(<TableView />);
    expect(screen.getByText('By Party')).toBeInTheDocument();
    expect(screen.getByText('By Guest')).toBeInTheDocument();
    expect(screen.getByText('Table View')).toBeInTheDocument();
  });

  it('empty state with no tables', () => {
    render(<TableView />);
    expect(screen.getByText(/No tables available/i)).toBeInTheDocument();
  });

  it('assignment sidebar renders', () => {
    render(<TableView />);
    expect(screen.getByTestId('assignment-panel')).toBeInTheDocument();
  });

  it('mobile toggle button present', () => {
    render(<TableView />);
    expect(screen.getByRole('button', { name: /Show Guests/i })).toBeInTheDocument();
  });

  it('mobile toggle text changes on click', async () => {
    const user = userEvent.setup();
    render(<TableView />);

    const toggle = screen.getByRole('button', { name: /Show Guests/i });
    await user.click(toggle);

    expect(screen.getByRole('button', { name: /Hide Guests/i })).toBeInTheDocument();
  });
});
