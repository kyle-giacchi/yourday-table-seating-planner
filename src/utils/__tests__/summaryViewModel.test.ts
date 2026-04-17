import { describe, it, expect } from 'vitest';
import { buildSummaryViewModel } from '@/utils/summaryViewModel';
import { createMockGuest, createMockTable } from '@/test/helpers';

describe('buildSummaryViewModel alerts — allergies', () => {
  it('surfaces an allergy alert when any guest has allergy flags', () => {
    const table = createMockTable({
      guests: [
        createMockGuest({ fullName: 'Alice', allergyFlags: ['nut'] }),
        createMockGuest({ fullName: 'Bob', allergyFlags: ['gluten', 'dairy'] }),
        createMockGuest({ fullName: 'Carol' }),
      ],
    });
    const vm = buildSummaryViewModel([table], []);
    const allergyAlert = vm.alerts.find((a) => a.id === 'allergies');
    expect(allergyAlert).toBeDefined();
    expect(allergyAlert?.severity).toBe('error');
    expect(allergyAlert?.title).toContain('2');
  });

  it('does not emit allergy alert when no guest has flags', () => {
    const vm = buildSummaryViewModel(
      [createMockTable({ guests: [createMockGuest({ fullName: 'Alice' })] })],
      [],
    );
    expect(vm.alerts.find((a) => a.id === 'allergies')).toBeUndefined();
  });

  it('counts unassigned guests with allergy flags too', () => {
    const vm = buildSummaryViewModel(
      [],
      [createMockGuest({ fullName: 'Diane', allergyFlags: ['shellfish'] })],
    );
    const allergyAlert = vm.alerts.find((a) => a.id === 'allergies');
    expect(allergyAlert).toBeDefined();
    expect(allergyAlert?.title).toContain('1');
  });
});

describe('buildSummaryViewModel splitPartyCount', () => {
  it('counts parties that span more than one table', () => {
    const t1 = createMockTable({
      name: 'T1',
      tableNumber: 1,
      guests: [
        createMockGuest({ fullName: 'Alice Smith', party: 'Smith' }),
        createMockGuest({ fullName: 'Bob Jones', party: 'Jones' }),
      ],
    });
    const t2 = createMockTable({
      name: 'T2',
      tableNumber: 2,
      guests: [createMockGuest({ fullName: 'Carol Smith', party: 'Smith' })],
    });
    const vm = buildSummaryViewModel([t1, t2], []);
    // Smith is split (T1 + T2). Jones is on T1 only.
    expect(vm.splitPartyCount).toBe(1);
  });

  it('returns 0 when every party is on one table', () => {
    const table = createMockTable({
      guests: [
        createMockGuest({ fullName: 'Alice', party: 'A' }),
        createMockGuest({ fullName: 'Bob', party: 'B' }),
      ],
    });
    const vm = buildSummaryViewModel([table], []);
    expect(vm.splitPartyCount).toBe(0);
  });
});
