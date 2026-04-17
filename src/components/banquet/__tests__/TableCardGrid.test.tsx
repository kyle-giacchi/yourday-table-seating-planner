import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TableCardGrid } from '@/components/banquet/TableCardGrid';
import type { BanquetSummaryData } from '@/types/banquet';

const headTable: BanquetSummaryData['tableAssignments'][number] = {
  tableNumber: 1,
  tableName: 'Sweetheart 1',
  tableSize: '96" x 30"',
  shape: 'rectangle',
  capacity: 8,
  defaultChairs: 8,
  isHeadTable: true,
  guests: [
    {
      name: 'Alice Smith',
      mealSelection: 'Chicken',
      allergyFlags: ['nut', 'gluten'],
      dietaryNotes: 'Severe peanut allergy',
    },
    { name: 'Bob Jones', mealSelection: 'Chicken' },
    { name: 'Carol White', mealSelection: 'Beef' },
  ],
};

describe('TableCardGrid', () => {
  it('renders a HEAD TABLE badge on head tables', () => {
    render(<TableCardGrid assignments={[headTable]} extraSeatTables={[]} emptyTables={0} />);
    expect(screen.getByText(/HEAD TABLE/i)).toBeInTheDocument();
  });

  it('renders the table size/shape/chair count line', () => {
    render(<TableCardGrid assignments={[headTable]} extraSeatTables={[]} emptyTables={0} />);
    expect(screen.getByText(/96" x 30" rectangle · 8 chairs/)).toBeInTheDocument();
  });

  it('renders an ALLERGY badge next to flagged guests', () => {
    render(<TableCardGrid assignments={[headTable]} extraSeatTables={[]} emptyTables={0} />);
    const aliceRow = screen.getByText('Alice Smith').closest('li')!;
    expect(within(aliceRow).getByText(/ALLERGY/i)).toBeInTheDocument();
  });

  it('renders a meal color mini-tally on each table card header', () => {
    render(<TableCardGrid assignments={[headTable]} extraSeatTables={[]} emptyTables={0} />);
    expect(screen.getByText(/×2/i)).toBeInTheDocument();
    expect(screen.getByText(/×1/i)).toBeInTheDocument();
  });
});
