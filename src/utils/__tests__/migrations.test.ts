import { describe, it, expect } from 'vitest';
import { migrateData, MIGRATIONS, CURRENT_VERSION } from '@/utils/migrations';

describe('migrations', () => {
  describe('migrateData', () => {
    it('returns null for non-object input', () => {
      expect(migrateData(null)).toBeNull();
      expect(migrateData(undefined)).toBeNull();
      expect(migrateData('string')).toBeNull();
      expect(migrateData(42)).toBeNull();
    });

    it('passes through data already at CURRENT_VERSION', () => {
      const data = {
        version: CURRENT_VERSION,
        tables: [{ id: 't1', name: 'Table 1', guests: [] }],
        guests: [],
        settings: {},
      };
      const result = migrateData(data);
      expect(result).toEqual(data);
    });

    it('treats missing version as 1.0.0 and walks the chain to CURRENT_VERSION', () => {
      const data = {
        // no version field
        tables: [{ tableNumber: 1, guests: [] }],
        guests: [],
        settings: {},
      };
      const result = migrateData(data);
      expect(result).not.toBeNull();
      expect(result?.version).toBe(CURRENT_VERSION);
    });

    it('migrates v1.0.0 tables: assigns name from tableNumber when name missing', () => {
      const data = {
        version: '1.0.0',
        tables: [
          { tableNumber: 3, guests: [] },
          { tableNumber: 7, name: 'VIP Table', guests: [] },
        ],
        guests: [],
        settings: {},
      };
      const result = migrateData(data) as {
        version: string;
        tables: Array<{ tableNumber: number; name: string }>;
      } | null;

      expect(result?.version).toBe(CURRENT_VERSION);
      expect(result?.tables[0].name).toBe('Table 3');
      // Existing names should be preserved.
      expect(result?.tables[1].name).toBe('VIP Table');
    });

    it('migrates v1.0.0 tables that lack a tableNumber: uses index+1', () => {
      const data = {
        version: '1.0.0',
        tables: [{ guests: [] }, { guests: [] }],
        guests: [],
        settings: {},
      };
      const result = migrateData(data) as {
        tables: Array<{ tableNumber: number; name: string }>;
      } | null;

      expect(result?.tables[0]).toMatchObject({ tableNumber: 1, name: 'Table 1' });
      expect(result?.tables[1]).toMatchObject({ tableNumber: 2, name: 'Table 2' });
    });

    it('migrates v1.1.0 → CURRENT_VERSION while preserving payload', () => {
      const data = {
        version: '1.1.0',
        tables: [{ id: 'a', name: 'Table 1', guests: [] }],
        guests: [{ id: 'g1', fullName: 'Alice' }],
        settings: { theme: 'dark' },
      };
      const result = migrateData(data) as Record<string, unknown> | null;
      expect(result?.version).toBe(CURRENT_VERSION);
      expect(result?.guests).toEqual(data.guests);
      expect(result?.settings).toEqual(data.settings);
    });

    it('returns null for an unknown version not in the chain', () => {
      const data = { version: '0.5.0', tables: [], guests: [], settings: {} };
      expect(migrateData(data)).toBeNull();
    });

    it('does not mutate the original input object', () => {
      const data = {
        version: '1.0.0',
        tables: [{ tableNumber: 1, guests: [] }],
        guests: [],
        settings: {},
      };
      const snapshot = JSON.parse(JSON.stringify(data));
      migrateData(data);
      expect(data).toEqual(snapshot);
    });
  });

  describe('MIGRATIONS chain integrity', () => {
    it('has consecutive fromVersion → toVersion links', () => {
      for (let i = 0; i < MIGRATIONS.length - 1; i++) {
        expect(MIGRATIONS[i].toVersion).toBe(MIGRATIONS[i + 1].fromVersion);
      }
    });

    it('terminates at CURRENT_VERSION', () => {
      expect(MIGRATIONS[MIGRATIONS.length - 1].toVersion).toBe(CURRENT_VERSION);
    });
  });
});
