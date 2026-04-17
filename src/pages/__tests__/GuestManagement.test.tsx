import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import GuestManagement from '@/pages/GuestManagement';
import { createMockGuest, createMockTable } from '@/test/helpers';
import type { SeatingData } from '@/types/seating';

// --- Mocks ---

const mockToast = vi.fn();
const mockNavigate = vi.fn();

const mockExportGuestsToCSV = vi.fn();
vi.mock('@/lib/guestExportUtils', () => ({
  exportGuestsToCSV: (...args: unknown[]) => mockExportGuestsToCSV(...args),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

let mockSeatingData: SeatingData = { tables: [], unassignedGuests: [] };

vi.mock('@/hooks/useSeating', () => ({
  useSeating: () => ({
    seatingData: mockSeatingData,
    addGuest: vi.fn(),
    updateGuest: vi.fn(),
    removeGuest: vi.fn(),
  }),
}));

vi.mock('@/contexts/SeatingDataContext', () => ({
  useSeatingData: () => ({
    seatingData: mockSeatingData,
    addGuest: vi.fn(),
    updateGuest: vi.fn(),
    removeGuest: vi.fn(),
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

let mockMealOptions: string[] = ['Chicken', 'Beef', 'Fish', 'No Meal Selected'];
const mockAddMealOptions = vi.fn();

vi.mock('@/contexts/MealOptionsContext', () => ({
  useMealOptions: () => ({
    mealOptions: mockMealOptions,
    addMealOption: vi.fn(),
    addMealOptions: mockAddMealOptions,
    removeMealOption: vi.fn(),
    updateMealOption: vi.fn(),
    resetToDefaults: vi.fn(),
  }),
}));

describe('GuestManagement page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSeatingData = { tables: [], unassignedGuests: [] };
    mockMealOptions = ['Chicken', 'Beef', 'Fish', 'No Meal Selected'];
  });

  it('renders page title', () => {
    render(<GuestManagement />);
    expect(screen.getByText('Guest Management')).toBeInTheDocument();
  });

  it('shows total guest count in stats', () => {
    const g1 = createMockGuest({ id: 'u1' });
    const g2 = createMockGuest({ id: 'u2' });
    mockSeatingData = { tables: [], unassignedGuests: [g1, g2] };

    render(<GuestManagement />);
    // Labels are now capitalized: "Guests"
    expect(screen.getByText('Guests')).toBeInTheDocument();
    expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1);
  });

  it('displays guest names in grid', () => {
    const g1 = createMockGuest({
      id: 'g1',
      fullName: 'Alice Green',
      firstName: 'Alice',
      lastName: 'Green',
    });
    const g2 = createMockGuest({
      id: 'g2',
      fullName: 'Bob Brown',
      firstName: 'Bob',
      lastName: 'Brown',
    });
    mockSeatingData = { tables: [], unassignedGuests: [g1, g2] };

    render(<GuestManagement />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('"Add Guest" button present in grid card', () => {
    mockSeatingData = { tables: [], unassignedGuests: [createMockGuest()] };
    render(<GuestManagement />);
    expect(screen.getByRole('button', { name: /Add Guest/i })).toBeInTheDocument();
  });

  it('"Upload guest file" icon button present in grid card', () => {
    mockSeatingData = { tables: [], unassignedGuests: [createMockGuest()] };
    render(<GuestManagement />);
    expect(screen.getByRole('button', { name: /Upload guest file/i })).toBeInTheDocument();
  });

  it('"Download guest list" icon button present in grid card', () => {
    mockSeatingData = { tables: [], unassignedGuests: [createMockGuest()] };
    render(<GuestManagement />);
    expect(screen.getByRole('button', { name: /Download guest list/i })).toBeInTheDocument();
  });

  it('download button calls export function', async () => {
    const user = userEvent.setup();
    mockSeatingData = { tables: [], unassignedGuests: [createMockGuest()] };
    render(<GuestManagement />);

    await user.click(screen.getByRole('button', { name: /Download guest list/i }));

    expect(mockExportGuestsToCSV).toHaveBeenCalled();
  });

  it('download error shows destructive toast', async () => {
    const user = userEvent.setup();
    mockExportGuestsToCSV.mockImplementation(() => {
      throw new Error('fail');
    });
    mockSeatingData = { tables: [], unassignedGuests: [createMockGuest()] };
    render(<GuestManagement />);

    await user.click(screen.getByRole('button', { name: /Download guest list/i }));

    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive' }));
  });

  it('empty state shows hero card when no guests', () => {
    render(<GuestManagement />);
    expect(screen.getByRole('heading', { name: /Let's add your guests/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add First Guest/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Upload Guest List/i })).toBeInTheDocument();
  });

  it('empty state hides stats card and grid', () => {
    render(<GuestManagement />);
    expect(screen.queryByText('Guests')).not.toBeInTheDocument();
    expect(screen.queryByText('Parties')).not.toBeInTheDocument();
  });

  it('empty state shows meal options banner when no meals configured', () => {
    mockMealOptions = [];
    render(<GuestManagement />);
    expect(screen.getByText(/No meal options configured/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Quick add 5 defaults/i })).toBeInTheDocument();
  });

  it('empty state hides meal banner when meals already configured', () => {
    render(<GuestManagement />);
    expect(screen.queryByText(/No meal options configured/i)).not.toBeInTheDocument();
  });

  it('quick add meals button calls addMealOptions with 5 defaults', async () => {
    const user = userEvent.setup();
    mockMealOptions = [];
    render(<GuestManagement />);

    await user.click(screen.getByRole('button', { name: /Quick add 5 defaults/i }));

    expect(mockAddMealOptions).toHaveBeenCalledWith([
      'Chicken',
      'Beef',
      'Fish',
      'Vegetarian',
      'Vegan',
    ]);
  });

  // --- Stats card content ---
  // The old "status line" copy was replaced by a metrics grid + % seated bar.
  // These tests pin the key numbers a user expects to see in the stats card.

  it('renders the empty-state hero when no guests exist', () => {
    mockSeatingData = { tables: [], unassignedGuests: [] };
    render(<GuestManagement />);
    // GuestStatsCard is not rendered in the empty state
    expect(screen.queryByText(/% seated/i)).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Let's add your guests/i })).toBeInTheDocument();
  });

  it('shows unassigned count and "Seat them" nudge when guests are unassigned', () => {
    const g1 = createMockGuest({ id: 'u1' });
    const g2 = createMockGuest({ id: 'u2' });
    mockSeatingData = { tables: [], unassignedGuests: [g1, g2] };
    render(<GuestManagement />);
    // "Unassigned" label can appear both in the stats grid and per-row badges
    expect(screen.getAllByText('Unassigned').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Seat them/i })).toBeInTheDocument();
    // 0% seated when none are at a table
    expect(screen.getByText(/0% seated/i)).toBeInTheDocument();
  });

  it('shows 100% seated and no "Seat them" button when all guests are at tables', () => {
    const g1 = createMockGuest({ id: 'a1' });
    const g2 = createMockGuest({ id: 'a2' });
    const table = createMockTable({ id: 't1', guests: [g1, g2] });
    mockSeatingData = { tables: [table], unassignedGuests: [] };
    render(<GuestManagement />);
    expect(screen.getByText(/100% seated/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Seat them/i })).not.toBeInTheDocument();
  });

  it('shows partial-seated percentage when some guests are assigned and some are not', () => {
    const g1 = createMockGuest({ id: 'a1' });
    const g2 = createMockGuest({ id: 'u1' });
    const g3 = createMockGuest({ id: 'u2' });
    const table = createMockTable({ id: 't1', guests: [g1] });
    mockSeatingData = { tables: [table], unassignedGuests: [g2, g3] };
    render(<GuestManagement />);
    // 1 of 3 seated = 33%
    expect(screen.getByText(/33% seated/i)).toBeInTheDocument();
  });

  // --- Seat them nudge ---

  it('renders "Seat them" button in stats card when guests are unassigned', () => {
    const g1 = createMockGuest({ id: 'u1' });
    mockSeatingData = { tables: [], unassignedGuests: [g1] };
    render(<GuestManagement />);
    expect(screen.getByRole('button', { name: /Seat them/i })).toBeInTheDocument();
  });

  it('does not render "Seat them" button when all guests are seated', () => {
    const g1 = createMockGuest({ id: 'a1' });
    const table = createMockTable({ id: 't1', guests: [g1] });
    mockSeatingData = { tables: [table], unassignedGuests: [] };
    render(<GuestManagement />);
    expect(screen.queryByRole('button', { name: /Seat them/i })).not.toBeInTheDocument();
  });

  it('"Seat them" button navigates to /seating', async () => {
    const user = userEvent.setup();
    const g1 = createMockGuest({ id: 'u1' });
    mockSeatingData = { tables: [], unassignedGuests: [g1] };
    render(<GuestManagement />);

    await user.click(screen.getByRole('button', { name: /Seat them/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/seating');
  });
});
