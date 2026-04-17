import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExportActions } from '@/components/banquet/ExportActions';
import { buildSummaryViewModel } from '@/utils/summaryViewModel';
import { createMockGuest, createMockTable } from '@/test/helpers';

const vm = buildSummaryViewModel(
  [
    createMockTable({
      name: 'Head Table',
      tableNumber: 1,
      guests: [createMockGuest({ fullName: 'Alice Smith', mealSelection: 'Chicken' })],
    }),
  ],
  [],
);

describe('ExportActions', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it('does not render a PDF button', () => {
    render(<ExportActions vm={vm} />);
    expect(screen.queryByRole('button', { name: /pdf/i })).not.toBeInTheDocument();
  });

  it('copies real summary text when Copy is clicked', async () => {
    render(<ExportActions vm={vm} />);
    fireEvent.click(screen.getByRole('button', { name: /copy/i }));
    await vi.waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
    });
    const mockFn = navigator.clipboard.writeText as unknown as ReturnType<typeof vi.fn>;
    const arg = mockFn.mock.calls[0][0] as string;
    expect(arg).toContain('Head Table');
    expect(arg).toContain('Smith, Alice');
    expect(arg).not.toContain('Please check the detailed breakdown');
  });
});
