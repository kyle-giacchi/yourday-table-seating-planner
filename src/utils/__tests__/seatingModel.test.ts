import { describe, it, expect } from 'vitest';
import { createMockGuest, createMockTable } from '@/test/helpers';
import {
  canonicalPartyName,
  moveGuests,
  planAssignment,
  previewPartyBlock,
  reorderPartyBlock,
} from '@/utils/seatingModel';

const g = (id: string, party: string) => createMockGuest({ id, party });
const ids = (guests: { id: string }[]) => guests.map((x) => x.id);

describe('seatingModel', () => {
  it('moveGuests: unassigned → table, table → table, table → unassigned', () => {
    const model = {
      tables: [createMockTable({ id: 'a', guests: [g('s1', 'X')] }), createMockTable({ id: 'b' })],
      unassignedGuests: [g('u1', 'Y')],
    };
    const m1 = moveGuests(model, ['u1', 's1'], 'b');
    expect(ids(m1.tables[1].guests)).toEqual(['u1', 's1']);
    expect(m1.tables[0].guests).toEqual([]);
    expect(m1.unassignedGuests).toEqual([]);

    const m2 = moveGuests(m1, ['s1'], null);
    expect(ids(m2.unassignedGuests)).toEqual(['s1']);
    expect(moveGuests(model, ['nope'], 'b')).toBe(model);
    expect(moveGuests(model, ['u1'], 'missing-table')).toBe(model);
  });

  it('planAssignment: party members matched case-insensitively, already-seated skipped', () => {
    const model = {
      tables: [createMockTable({ id: 't', guests: [g('a', 'Smith')], defaultChairs: 2 })],
      unassignedGuests: [g('b', 'SMITH'), g('c', 'smith '), g('d', 'Jones')],
    };
    const plan = planAssignment(model, { type: 'party', partyName: 'smith' }, 't');
    expect(plan?.guestIds).toEqual(['b', 'c']);
    expect(plan?.capacity.newCount).toBe(3);
    expect(
      planAssignment(model, { type: 'party', partyName: 'Smith', sourceTableId: 't' }, 't'),
    ).toBeNull();
  });

  it('reorder + preview treat mixed-case party members as one block', () => {
    const guests = [g('1', 'Smith'), g('2', 'A'), g('3', 'smith'), g('4', 'B'), g('5', 'B')];
    expect(ids(reorderPartyBlock(guests, 'SMITH', 99))).toEqual(['2', '4', '5', '1', '3']);
    expect(previewPartyBlock(guests, 'smith', 2)).toEqual({
      target: 2,
      start: 2,
      end: 3,
      splitPartyName: 'B',
    });
    expect(previewPartyBlock(guests, 'nobody', 0)).toBeNull();
  });

  it('canonicalPartyName reuses existing casing', () => {
    const model = { tables: [], unassignedGuests: [g('1', 'Smith Family')] };
    expect(canonicalPartyName('smith family', model)).toBe('Smith Family');
    expect(canonicalPartyName('New', model)).toBe('New');
  });
});
