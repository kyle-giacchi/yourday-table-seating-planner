import type { SummaryViewModel } from '@/utils/summaryViewModel';

const pad = (s: string, n: number): string => (s.length >= n ? s : s + ' '.repeat(n - s.length));

const formatGuestLastFirst = (fullName: string): string => {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length < 2) return fullName;
  const last = parts[parts.length - 1];
  const first = parts.slice(0, -1).join(' ');
  return `${last}, ${first}`;
};

/**
 * Plain-text banquet summary suitable for pasting into email, Slack, or a
 * kitchen runner sheet. Stable line ordering so caterers can diff day-over-day.
 */
export const formatBanquetSummaryText = (vm: SummaryViewModel): string => {
  const lines: string[] = [];
  const { summary, utilization, emptyTables } = vm;
  const generated = new Date().toLocaleString();

  lines.push('BANQUET TEAM SUMMARY');
  lines.push(`Generated: ${generated}`);
  lines.push('');
  lines.push(`Total guests: ${summary.totalGuests}`);
  lines.push(`  Seated: ${summary.assignedGuests}`);
  lines.push(`  Unseated: ${summary.unassignedGuests}`);
  lines.push(`Tables in use: ${vm.tablesInUse} of ${summary.totalTables}`);
  lines.push(`Empty seats: ${utilization.emptySeats} (${emptyTables} empty tables)`);
  lines.push('');

  lines.push('MEAL TOTALS');
  for (const item of summary.foodSummary) {
    lines.push(`  ${pad(item.mealType + ':', 22)}${item.count}`);
  }
  lines.push('');

  if (vm.alerts.length > 0) {
    lines.push('ALERTS');
    for (const alert of vm.alerts) {
      const marker = alert.severity === 'error' ? '!!' : '! ';
      lines.push(`  ${marker} ${alert.title} — ${alert.detail}`);
    }
    lines.push('');
  }

  lines.push('TABLE ASSIGNMENTS');
  for (const assignment of summary.tableAssignments) {
    const mealCounts = new Map<string, number>();
    for (const g of assignment.guests) {
      mealCounts.set(g.mealSelection, (mealCounts.get(g.mealSelection) ?? 0) + 1);
    }
    const mealLine = Array.from(mealCounts.entries())
      .map(([meal, count]) => `${meal} x${count}`)
      .join(', ');
    lines.push('');
    lines.push(`${assignment.tableName} (${assignment.guests.length} guests) — ${mealLine}`);
    for (const guest of assignment.guests) {
      lines.push(`  ${formatGuestLastFirst(guest.name)} — ${guest.mealSelection}`);
    }
  }

  return lines.join('\n');
};
