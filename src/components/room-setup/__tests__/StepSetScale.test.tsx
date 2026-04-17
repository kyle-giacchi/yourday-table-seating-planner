import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// jsdom lacks ResizeObserver; the component calls `new ResizeObserver(...)` in
// an effect, so a no-op stub is enough to let render proceed.
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as any).ResizeObserver = MockResizeObserver;

// Minimal useSeating shape StepSetScale reads from
const mockState = {
  roomOutlineState: {
    x: 25,
    y: 20,
    width: 50,
    height: 50,
    realWorldWidth: 20,
    realWorldHeight: 20,
    isVisible: true,
  },
  backgroundImageState: {
    backgroundImage: 'data:image/jpeg;base64,abc',
    imageOpacity: 1,
  },
  isReferenceLocked: false,
  updateRoomOutline: vi.fn(),
  setImageOpacity: vi.fn(),
  lockReference: vi.fn(),
  unlockReference: vi.fn(),
};

vi.mock('@/hooks/useSeating', () => ({
  useSeating: () => mockState,
}));

// Stub out the heavy child components so rendering doesn't choke on canvas math
vi.mock('@/components/room-setup/ScaleRectangle', () => ({
  ScaleRectangle: ({ labelText }: { labelText?: string }) => (
    <div data-testid="scale-rect">{labelText ?? 'no-label'}</div>
  ),
}));
vi.mock('@/components/room-setup/ScaleReferenceShape', () => ({
  ScaleReferenceShape: () => <div />,
}));
vi.mock('@/components/room-setup/ScaleSetupGrid', () => ({
  ScaleSetupGrid: () => <div />,
}));

import { StepSetScale } from '../StepSetScale';

describe('StepSetScale dimension validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.updateRoomOutline.mockClear();
    mockState.isReferenceLocked = false;
  });

  const setup = () =>
    render(
      <MemoryRouter>
        <StepSetScale onBack={vi.fn()} />
      </MemoryRouter>,
    );

  it('accepts valid dimensions and passes them to updateRoomOutline', () => {
    setup();
    const width = screen.getByLabelText('W') as HTMLInputElement;
    fireEvent.change(width, { target: { value: '25' } });

    expect(width.value).toBe('25');
    expect(mockState.updateRoomOutline).toHaveBeenCalledWith(
      expect.objectContaining({ realWorldWidth: 25 }),
    );
    expect(screen.queryByText(/Enter a width and height between/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirm scale/i })).not.toBeDisabled();
  });

  it('does not propagate values below the minimum (1 ft) and shows the error banner', () => {
    setup();
    const width = screen.getByLabelText('W') as HTMLInputElement;
    fireEvent.change(width, { target: { value: '0' } });

    expect(width.value).toBe('0');
    // updateRoomOutline should NOT have been called with realWorldWidth: 0
    expect(
      mockState.updateRoomOutline.mock.calls.some((call) => call[0]?.realWorldWidth === 0),
    ).toBe(false);

    expect(screen.getByText(/Enter a width and height between/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirm scale/i })).toBeDisabled();
  });

  it('does not propagate values above the max (10 000 ft) and shows the error banner', () => {
    setup();
    const height = screen.getByLabelText('H') as HTMLInputElement;
    fireEvent.change(height, { target: { value: '100000' } });

    expect(height.value).toBe('100000');
    expect(
      mockState.updateRoomOutline.mock.calls.some((call) => call[0]?.realWorldHeight === 100000),
    ).toBe(false);

    expect(screen.getByText(/Enter a width and height between/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirm scale/i })).toBeDisabled();
  });

  it('accepts boundary value of 10 000 ft and propagates it', () => {
    setup();
    const width = screen.getByLabelText('W') as HTMLInputElement;
    fireEvent.change(width, { target: { value: '10000' } });

    expect(width.value).toBe('10000');
    expect(mockState.updateRoomOutline).toHaveBeenCalledWith(
      expect.objectContaining({ realWorldWidth: 10000 }),
    );
    expect(screen.queryByText(/Enter a width and height between/i)).not.toBeInTheDocument();
  });

  it('disables the Confirm Scale button when dimensions are out of range', () => {
    setup();
    const width = screen.getByLabelText('W') as HTMLInputElement;
    fireEvent.change(width, { target: { value: '99999' } });

    expect(width.value).toBe('99999');
    const confirm = screen.getByRole('button', { name: /confirm scale/i });
    expect(confirm).toBeDisabled();
    expect(screen.getByText(/Enter a width and height between/i)).toBeInTheDocument();
  });
});
