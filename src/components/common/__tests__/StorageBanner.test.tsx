import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StorageBanner } from '@/components/common/StorageBanner';

const detectStorageStatusMock = vi.fn();

vi.mock('@/lib/safeStorage', () => ({
  detectStorageStatus: () => detectStorageStatusMock(),
}));

describe('StorageBanner', () => {
  beforeEach(() => {
    detectStorageStatusMock.mockReset();
    sessionStorage.clear();
  });

  it('renders nothing when storage is available', () => {
    detectStorageStatusMock.mockReturnValue('available');
    const { container } = render(<StorageBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('shows "blocked" message when storage setItem throws', () => {
    detectStorageStatusMock.mockReturnValue('blocked');
    render(<StorageBanner />);
    expect(screen.getByText(/browser storage is blocked or full/i)).toBeInTheDocument();
  });

  it('shows "unavailable" message when storage API is missing', () => {
    detectStorageStatusMock.mockReturnValue('unavailable');
    render(<StorageBanner />);
    expect(screen.getByText(/doesn't give us access to local storage/i)).toBeInTheDocument();
  });

  it('dismisses via the close button and remembers the dismissal in sessionStorage', () => {
    detectStorageStatusMock.mockReturnValue('blocked');
    const { unmount } = render(<StorageBanner />);

    const dismiss = screen.getByRole('button', { name: /dismiss storage warning/i });
    fireEvent.click(dismiss);

    expect(screen.queryByText(/browser storage is blocked or full/i)).not.toBeInTheDocument();

    // Mount again in the same session — banner should stay hidden
    unmount();
    render(<StorageBanner />);
    expect(screen.queryByText(/browser storage is blocked or full/i)).not.toBeInTheDocument();
  });
});
