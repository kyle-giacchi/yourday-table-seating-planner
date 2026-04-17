import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';

vi.mock('@/hooks/useSeating', () => ({
  useSeating: () => ({
    backgroundImageState: { backgroundImage: null },
    isReferenceLocked: false,
    showScaleGrid: false,
    setShowScaleGrid: vi.fn(),
    pinAllPills: false,
    setPinAllPills: vi.fn(),
    seatingData: {
      tables: [
        { id: 't1', guests: [{ id: 'g1' }, { id: 'g2' }] },
        { id: 't2', guests: [{ id: 'g3' }] },
      ],
      unassignedGuests: [{ id: 'g4' }, { id: 'g5' }],
    },
    addTable: vi.fn(),
    addAsset: vi.fn(),
    selectAsset: vi.fn(),
    zoomState: { centerX: 0, centerY: 0 },
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

import { CanvasToolbar } from '../CanvasToolbar';

const renderToolbar = () =>
  render(
    <MemoryRouter>
      <TooltipProvider>
        <CanvasToolbar />
      </TooltipProvider>
    </MemoryRouter>,
  );

describe('CanvasToolbar status zone', () => {
  it('shows assigned/total guests', () => {
    renderToolbar();
    expect(screen.getByText('3/5')).toBeInTheDocument();
    expect(screen.getByText('placed')).toBeInTheDocument();
  });

  it('shows table count', () => {
    renderToolbar();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('tables')).toBeInTheDocument();
  });

  it('shows upload background CTA when no image is present', () => {
    renderToolbar();
    expect(screen.getByRole('button', { name: /upload background/i })).toBeInTheDocument();
  });

  it('renders the Add Table primary CTA', () => {
    renderToolbar();
    expect(screen.getByRole('button', { name: /add table/i })).toBeInTheDocument();
  });
});
