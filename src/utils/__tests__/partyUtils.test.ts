import { describe, it, expect } from 'vitest';
import {
  partyKey,
  samePartyName,
  getPartiesFromGuests,
  getPartySize,
  getGuestsByParty,
  getOriginalPartySize,
  getPartyAssignmentStatus,
  getEnhancedPartiesFromGuests,
} from '@/utils/partyUtils';
import { createMockGuest, createMockTable } from '@/test/helpers';

describe('partyUtils', () => {
  describe('getPartiesFromGuests', () => {
    it('groups guests by party name and counts size', () => {
      const guests = [
        createMockGuest({ fullName: 'Alice', party: 'Smith' }),
        createMockGuest({ fullName: 'Bob', party: 'Smith' }),
        createMockGuest({ fullName: 'Carol', party: 'Jones' }),
      ];
      const parties = getPartiesFromGuests(guests);

      expect(parties).toHaveLength(2);
      const smith = parties.find((p) => p.name === 'Smith');
      expect(smith?.size).toBe(2);
      expect(smith?.guests.map((g) => g.fullName)).toEqual(['Alice', 'Bob']);
      const jones = parties.find((p) => p.name === 'Jones');
      expect(jones?.size).toBe(1);
    });

    it('returns empty array for empty guest list', () => {
      expect(getPartiesFromGuests([])).toEqual([]);
    });
  });

  describe('getPartySize / getGuestsByParty', () => {
    const guests = [
      createMockGuest({ party: 'Smith' }),
      createMockGuest({ party: 'Smith' }),
      createMockGuest({ party: 'Jones' }),
    ];

    it('counts guests in a party', () => {
      expect(getPartySize('Smith', guests)).toBe(2);
      expect(getPartySize('Jones', guests)).toBe(1);
      expect(getPartySize('Unknown', guests)).toBe(0);
    });

    it('returns the guests in a party', () => {
      expect(getGuestsByParty('Smith', guests)).toHaveLength(2);
      expect(getGuestsByParty('Unknown', guests)).toEqual([]);
    });
  });

  describe('getOriginalPartySize', () => {
    it('sums assigned + unassigned for a party', () => {
      const unassigned = [createMockGuest({ party: 'Smith' })];
      const tables = [
        createMockTable({
          guests: [createMockGuest({ party: 'Smith' }), createMockGuest({ party: 'Smith' })],
        }),
      ];
      expect(getOriginalPartySize('Smith', unassigned, tables)).toBe(3);
    });

    it('returns 0 when party has no guests anywhere', () => {
      expect(getOriginalPartySize('Ghost', [], [])).toBe(0);
    });
  });

  describe('getPartyAssignmentStatus', () => {
    it('detects partial assignment when both sides are non-empty', () => {
      const unassigned = [createMockGuest({ party: 'Smith' })];
      const tables = [
        createMockTable({
          guests: [createMockGuest({ party: 'Smith' }), createMockGuest({ party: 'Smith' })],
        }),
      ];
      const status = getPartyAssignmentStatus('Smith', unassigned, tables);

      expect(status).toEqual({
        originalSize: 3,
        assignedCount: 2,
        unassignedCount: 1,
        isPartiallyAssigned: true,
      });
    });

    it('reports fully-assigned (not partial) when nothing left unassigned', () => {
      const tables = [
        createMockTable({
          guests: [createMockGuest({ party: 'Smith' }), createMockGuest({ party: 'Smith' })],
        }),
      ];
      const status = getPartyAssignmentStatus('Smith', [], tables);
      expect(status.isPartiallyAssigned).toBe(false);
      expect(status.assignedCount).toBe(2);
      expect(status.unassignedCount).toBe(0);
    });

    it('reports fully-unassigned (not partial) when nothing seated', () => {
      const unassigned = [createMockGuest({ party: 'Smith' }), createMockGuest({ party: 'Smith' })];
      const status = getPartyAssignmentStatus('Smith', unassigned, []);
      expect(status.isPartiallyAssigned).toBe(false);
      expect(status.assignedCount).toBe(0);
      expect(status.unassignedCount).toBe(2);
    });

    it('counts guests across multiple tables', () => {
      const tables = [
        createMockTable({ guests: [createMockGuest({ party: 'Smith' })] }),
        createMockTable({
          guests: [createMockGuest({ party: 'Smith' }), createMockGuest({ party: 'Other' })],
        }),
      ];
      const status = getPartyAssignmentStatus('Smith', [], tables);
      expect(status.assignedCount).toBe(2);
      expect(status.originalSize).toBe(2);
    });
  });

  describe('getEnhancedPartiesFromGuests', () => {
    it('attaches assignment status to each unassigned party', () => {
      const unassigned = [createMockGuest({ party: 'Smith' }), createMockGuest({ party: 'Jones' })];
      const tables = [createMockTable({ guests: [createMockGuest({ party: 'Smith' })] })];
      const enhanced = getEnhancedPartiesFromGuests(unassigned, tables);

      const smith = enhanced.find((p) => p.name === 'Smith');
      expect(smith?.isPartiallyAssigned).toBe(true);
      expect(smith?.originalSize).toBe(2);

      const jones = enhanced.find((p) => p.name === 'Jones');
      expect(jones?.isPartiallyAssigned).toBe(false);
      expect(jones?.originalSize).toBe(1);
    });
  });

  // --- Case-insensitive normalization (C8) ---

  describe('partyKey', () => {
    it('lowercases and trims', () => {
      expect(partyKey('  Smith Family  ')).toBe('smith family');
      expect(partyKey('SMITH FAMILY')).toBe('smith family');
    });

    it('handles null/undefined/empty', () => {
      expect(partyKey(null)).toBe('');
      expect(partyKey(undefined)).toBe('');
      expect(partyKey('')).toBe('');
      expect(partyKey('   ')).toBe('');
    });
  });

  describe('samePartyName', () => {
    it('returns true for differently-cased equivalents', () => {
      expect(samePartyName('Smith Family', 'smith family')).toBe(true);
      expect(samePartyName('SMITH FAMILY', ' smith family ')).toBe(true);
    });

    it('returns false for different parties', () => {
      expect(samePartyName('Smith Family', 'Jones Family')).toBe(false);
    });

    it('treats empty/null values as equal to each other', () => {
      expect(samePartyName('', '')).toBe(true);
      expect(samePartyName(null, undefined)).toBe(true);
    });
  });

  describe('case-insensitive grouping', () => {
    it('merges parties that differ only in case, keeping first-seen casing', () => {
      const guests = [
        createMockGuest({ id: '1', party: 'Smith Family' }),
        createMockGuest({ id: '2', party: 'smith family' }),
        createMockGuest({ id: '3', party: 'SMITH FAMILY' }),
      ];

      const parties = getPartiesFromGuests(guests);

      expect(parties).toHaveLength(1);
      expect(parties[0].size).toBe(3);
      expect(parties[0].name).toBe('Smith Family');
    });

    it('getPartySize counts across casing', () => {
      const guests = [
        createMockGuest({ party: 'Smith Family' }),
        createMockGuest({ party: 'smith family' }),
      ];
      expect(getPartySize('Smith Family', guests)).toBe(2);
      expect(getPartySize('SMITH FAMILY', guests)).toBe(2);
    });

    it('getGuestsByParty filters across casing', () => {
      const guests = [
        createMockGuest({ id: '1', party: 'Smith Family' }),
        createMockGuest({ id: '2', party: 'smith family' }),
        createMockGuest({ id: '3', party: 'Other' }),
      ];
      expect(getGuestsByParty('SMITH FAMILY', guests)).toHaveLength(2);
    });

    it('getPartyAssignmentStatus counts mixed-case across tables and unassigned', () => {
      const unassigned = [createMockGuest({ party: 'smith family' })];
      const tables = [
        createMockTable({ guests: [createMockGuest({ party: 'Smith Family' })] }),
        createMockTable({ guests: [createMockGuest({ party: 'SMITH FAMILY' })] }),
      ];

      const status = getPartyAssignmentStatus('Smith Family', unassigned, tables);
      expect(status.originalSize).toBe(3);
      expect(status.assignedCount).toBe(2);
      expect(status.unassignedCount).toBe(1);
      expect(status.isPartiallyAssigned).toBe(true);
    });
  });
});
