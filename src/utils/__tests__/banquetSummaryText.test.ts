import { describe, it, expect } from 'vitest';
import { formatBanquetSummaryText } from '@/utils/banquetSummaryText';
import { buildSummaryViewModel } from '@/utils/summaryViewModel';
import { createMockGuest, createMockTable } from '@/test/helpers';

describe('formatBanquetSummaryText', () => {
  it('produces a complete text summary with per-table meal counts', () => {
    const table = createMockTable({
      name: 'Table 1',
      tableNumber: 1,
      tableSize: '60" diameter',
      shape: 'round',
      defaultChairs: 8,
      capacity: 8,
      guests: [
        createMockGuest({ fullName: 'Alice Smith', mealSelection: 'Chicken' }),
        createMockGuest({ fullName: 'Bob Smith', mealSelection: 'Chicken' }),
        createMockGuest({ fullName: 'Carol Smith', mealSelection: 'Beef' }),
      ],
    });
    const vm = buildSummaryViewModel([table], []);
    const text = formatBanquetSummaryText(vm);

    expect(text).toContain('BANQUET TEAM SUMMARY');
    expect(text).toContain('Total guests: 3');
    expect(text).toContain('Table 1');
    expect(text).toContain('Chicken x2');
    expect(text).toContain('Beef x1');
    expect(text).toContain('Smith, Alice');
  });

  it('handles empty data gracefully', () => {
    const vm = buildSummaryViewModel([], []);
    const text = formatBanquetSummaryText(vm);
    expect(text).toContain('BANQUET TEAM SUMMARY');
    expect(text).toContain('Total guests: 0');
  });

  it('lists global meal totals in the header block', () => {
    const vm = buildSummaryViewModel(
      [
        createMockTable({
          guests: [
            createMockGuest({ fullName: 'A B', mealSelection: 'Chicken' }),
            createMockGuest({ fullName: 'C D', mealSelection: 'Chicken' }),
            createMockGuest({ fullName: 'E F', mealSelection: 'Vegetarian' }),
          ],
        }),
      ],
      [],
    );
    const text = formatBanquetSummaryText(vm);
    expect(text).toMatch(/MEAL TOTALS[\s\S]*Chicken:\s*2/);
    expect(text).toMatch(/Vegetarian:\s*1/);
  });
});
