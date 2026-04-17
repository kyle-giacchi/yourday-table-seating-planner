import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTableAssignment } from '@/hooks/useTableAssignment';
import { TestProviders } from '@/test/helpers';

describe('useTableAssignment undo', () => {
  it('exposes lastAssignment=null initially and an undo function', () => {
    const { result } = renderHook(() => useTableAssignment(), { wrapper: TestProviders });
    expect(result.current.lastAssignment).toBeNull();
    expect(typeof result.current.undoLastAssignment).toBe('function');
  });
});
