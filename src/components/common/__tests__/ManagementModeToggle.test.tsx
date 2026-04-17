import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ManagementModeToggle } from '../ManagementModeToggle';

describe('ManagementModeToggle', () => {
  it('renders both tab labels', () => {
    render(<ManagementModeToggle mode="assignment" onModeChange={vi.fn()} />);
    expect(screen.getByText('Assign Guests')).toBeInTheDocument();
    expect(screen.getByText('Tables')).toBeInTheDocument();
  });

  it('calls onModeChange with table-editor when Tables tab clicked', async () => {
    const onChange = vi.fn();
    render(<ManagementModeToggle mode="assignment" onModeChange={onChange} />);
    await userEvent.click(screen.getByText('Tables'));
    expect(onChange).toHaveBeenCalledWith('table-editor');
  });

  it('calls onModeChange with assignment when Assign Guests tab clicked', async () => {
    const onChange = vi.fn();
    render(<ManagementModeToggle mode="table-editor" onModeChange={onChange} />);
    await userEvent.click(screen.getByText('Assign Guests'));
    expect(onChange).toHaveBeenCalledWith('assignment');
  });

  it('applies active styling to the current mode tab', () => {
    render(<ManagementModeToggle mode="assignment" onModeChange={vi.fn()} />);
    const assignBtn = screen.getByRole('button', { name: /assign guests/i });
    const tablesBtn = screen.getByRole('button', { name: /tables/i });
    expect(assignBtn).toHaveClass('bg-background');
    expect(tablesBtn).not.toHaveClass('bg-background');
  });
});
