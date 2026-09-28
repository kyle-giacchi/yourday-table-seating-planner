import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const mockSeatingState = {
  managementMode: 'assignment' as 'assignment' | 'tables',
  setManagementMode: vi.fn(),
  resetZoom: vi.fn(),
  seatingData: {
    tables: [
      { id: 't1', guests: [{ id: 'g1' }, { id: 'g2' }] },
      { id: 't2', guests: [{ id: 'g3' }] },
    ],
    unassignedGuests: [{ id: 'g4' }, { id: 'g5' }],
  },
  backgroundImageState: { backgroundImage: null as string | null, imageOpacity: 1 },
  isReferenceLocked: false,
};

vi.mock('@/hooks/useSeating', () => ({
  useSeating: () => mockSeatingState,
}));
vi.mock('@/utils/dragUtils', () => ({
  startGuestDrag: vi.fn(),
  startPartyDrag: vi.fn(),
}));
vi.mock('@/components/common/UnifiedAssignmentPanel', () => ({
  UnifiedAssignmentPanel: () => <div data-testid="assignment-panel" />,
}));
vi.mock('@/components/seating/CanvasToolbar', () => ({
  CanvasToolbar: () => <div />,
}));
vi.mock('@/components/seating', () => ({
  SeatingCanvas: () => <div />,
}));
vi.mock('@/components/seating/table-editor/TableEditor', () => ({
  TableEditor: () => <div />,
}));
vi.mock('@/hooks/useColumnHeightSync', () => ({
  useColumnHeightSync: vi.fn(),
}));
vi.mock('@/hooks/useTableAssignment', () => ({
  useTableAssignment: () => ({
    lastAssignment: null,
    undoLastAssignment: vi.fn(),
  }),
}));

import SeatingManager from '../SeatingManager';

const renderPage = () =>
  render(
    <MemoryRouter>
      <SeatingManager />
    </MemoryRouter>,
  );

describe('SeatingManager', () => {
  beforeEach(() => {
    mockSeatingState.backgroundImageState = { backgroundImage: null, imageOpacity: 1 };
    mockSeatingState.isReferenceLocked = false;
  });

  it('renders the page header', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /room layout planner/i })).toBeInTheDocument();
  });

  // --- B5: scale-not-set nudge ---

  describe('scale-not-set nudge', () => {
    it('shows the nudge when an image is loaded but scale is not locked', () => {
      mockSeatingState.backgroundImageState = {
        backgroundImage: 'data:image/jpeg;base64,fake',
        imageOpacity: 1,
      };
      mockSeatingState.isReferenceLocked = false;

      renderPage();

      expect(screen.getByText(/floor plan scale isn't set/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /set scale/i })).toBeInTheDocument();
    });

    it('does not show the nudge when scale is locked', () => {
      mockSeatingState.backgroundImageState = {
        backgroundImage: 'data:image/jpeg;base64,fake',
        imageOpacity: 1,
      };
      mockSeatingState.isReferenceLocked = true;

      renderPage();

      expect(screen.queryByText(/floor plan scale isn't set/i)).not.toBeInTheDocument();
    });

    it('does not show the nudge when there is no image at all', () => {
      mockSeatingState.backgroundImageState = { backgroundImage: null, imageOpacity: 1 };
      mockSeatingState.isReferenceLocked = false;

      renderPage();

      expect(screen.queryByText(/floor plan scale isn't set/i)).not.toBeInTheDocument();
    });
  });
});
