/**
 * Shared helpers for intra-table reorder flows (Table View, By Guest, By Party).
 */

/**
 * Returns the name of a party whose contiguous run of members would be split by
 * inserting a block at `target` in the given `others` array. Null if no split.
 */
export const findSplitPartyName = (
  others: Array<{ party: string }>,
  target: number,
): string | null => {
  if (target <= 0 || target >= others.length) return null;
  const before = others[target - 1].party;
  if (!before) return null;
  return before === others[target].party ? before : null;
};
