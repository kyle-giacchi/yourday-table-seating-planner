import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { CoachMarkBanner } from '@/components/seating/CoachMarkBanner';

describe('CoachMarkBanner', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders when visible=true and not dismissed', () => {
    render(<CoachMarkBanner visible />);
    expect(screen.getByText(/drag guests onto a table/i)).toBeInTheDocument();
  });

  it('hides when visible=false', () => {
    render(<CoachMarkBanner visible={false} />);
    expect(screen.queryByText(/drag guests onto a table/i)).not.toBeInTheDocument();
  });

  it('stays hidden after being dismissed', () => {
    const { unmount } = render(<CoachMarkBanner visible />);
    fireEvent.click(screen.getByLabelText(/dismiss tip/i));
    expect(screen.queryByText(/drag guests onto a table/i)).not.toBeInTheDocument();
    unmount();
    // Even on re-mount it stays dismissed via localStorage
    render(<CoachMarkBanner visible />);
    expect(screen.queryByText(/drag guests onto a table/i)).not.toBeInTheDocument();
  });
});
