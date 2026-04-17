import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PartiesCard } from '@/components/banquet/PartiesCard';
import type { PartyGroup } from '@/utils/summaryViewModel';

const makeParty = (name: string): PartyGroup => ({
  name,
  guestCount: 4,
  tableNames: ['Table 1'],
  meals: [{ mealType: 'Chicken', count: 4 }],
  unassignedCount: 0,
});

const tenParties: PartyGroup[] = [
  'Smith Family',
  'Jones Family',
  'Garcia Family',
  'Nguyen Family',
  'Patel Family',
  'Kim Family',
  'Brown Family',
  'Davis Family',
  'Miller Family',
  'Wilson Family',
].map(makeParty);

describe('PartiesCard', () => {
  it('renders only the first 6 parties when collapsed', () => {
    render(<PartiesCard parties={tenParties} />);

    expect(screen.getByText('Smith Family')).toBeInTheDocument();
    expect(screen.getByText('Kim Family')).toBeInTheDocument();
    expect(screen.queryByText('Brown Family')).not.toBeInTheDocument();
    expect(screen.queryByText('Wilson Family')).not.toBeInTheDocument();
  });

  it('expands to show previously hidden parties when beforeprint fires', () => {
    render(<PartiesCard parties={tenParties} />);

    // Brown / Wilson are in the hidden tail (index >= 6) before beforeprint
    expect(screen.queryByText('Brown Family')).not.toBeInTheDocument();
    expect(screen.queryByText('Wilson Family')).not.toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event('beforeprint'));
    });

    expect(screen.getByText('Brown Family')).toBeInTheDocument();
    expect(screen.getByText('Wilson Family')).toBeInTheDocument();
  });

  it('re-collapses after afterprint when user had not manually expanded', () => {
    render(<PartiesCard parties={tenParties} />);

    act(() => {
      window.dispatchEvent(new Event('beforeprint'));
    });
    expect(screen.getByText('Wilson Family')).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event('afterprint'));
    });
    expect(screen.queryByText('Wilson Family')).not.toBeInTheDocument();
  });
});
