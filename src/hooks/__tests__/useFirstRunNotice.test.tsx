import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

const toastMock = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: toastMock }),
}));

import { useFirstRunNotice } from '@/hooks/useFirstRunNotice';

const Harness = () => {
  useFirstRunNotice();
  return null;
};

describe('useFirstRunNotice', () => {
  beforeEach(() => {
    localStorage.clear();
    toastMock.mockClear();
  });

  it('shows the toast once on first mount', () => {
    render(<Harness />);
    expect(toastMock).toHaveBeenCalledTimes(1);
    expect(toastMock.mock.calls[0][0].title).toMatch(/saved in this browser/i);
  });

  it('does not show the toast if already dismissed', () => {
    localStorage.setItem('first-run-notice-shown', 'true');
    render(<Harness />);
    expect(toastMock).not.toHaveBeenCalled();
  });

  it('does not show again on re-mount', () => {
    const { unmount } = render(<Harness />);
    unmount();
    render(<Harness />);
    expect(toastMock).toHaveBeenCalledTimes(1);
  });
});
