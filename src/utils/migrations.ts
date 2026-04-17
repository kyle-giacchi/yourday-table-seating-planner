import type { AppData } from '@/types/appData';
import type { Table } from '@/types/seating';

export const CURRENT_VERSION = '1.2.0';

// --- Migration Types ---

export interface Migration {
  fromVersion: string;
  toVersion: string;
  migrate: (data: Record<string, unknown>) => Record<string, unknown>;
}

// --- Table Migration Helper (moved from DataRepository.ts) ---

const migrateTables = (tables: Partial<Table>[]): Partial<Table>[] => {
  if (!tables || tables.length === 0) return [];

  return tables.map((table, index) => {
    if (typeof table.tableNumber === 'number') {
      return {
        ...table,
        name: table.name || `Table ${table.tableNumber}`,
      };
    }

    const tableNumber = index + 1;
    return {
      ...table,
      tableNumber,
      name: table.name || `Table ${tableNumber}`,
    };
  });
};

// --- Migration Chain ---

export const MIGRATIONS: Migration[] = [
  {
    fromVersion: '1.0.0',
    toVersion: '1.1.0',
    migrate: (data) => {
      const migratedTables = migrateTables((data.tables as Partial<Table>[] | undefined) ?? []);
      return {
        ...data,
        tables: migratedTables,
        version: '1.1.0',
      };
    },
  },
  {
    fromVersion: '1.1.0',
    toVersion: '1.2.0',
    migrate: (data) => ({
      ...data,
      version: '1.2.0',
    }),
  },
];

// --- Migration Runner ---

/**
 * Applies incremental migrations to bring data from its current version
 * up to CURRENT_VERSION. Preserves all user data that isn't explicitly
 * transformed by a migration step.
 *
 * Edge cases:
 *  - Missing version field: treated as '1.0.0' (earliest known version)
 *  - Unknown version not in chain: returns null to signal fallback to defaults
 *  - Already at CURRENT_VERSION: returns data as-is
 */
export function migrateData(data: unknown): AppData | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const record = data as Record<string, unknown>;
  let currentVersion: string = (record.version as string) || '1.0.0';

  if (currentVersion === CURRENT_VERSION) {
    // Trust boundary: caller (DataRepository.loadAppData) runs
    // validateStorageData/validateAppSettings before consuming fields.
    const trusted: unknown = record;
    return trusted as AppData;
  }

  let migrated: Record<string, unknown> = { ...record };
  let safety = 0;
  const maxSteps = MIGRATIONS.length;

  while (currentVersion !== CURRENT_VERSION && safety < maxSteps) {
    const nextMigration = MIGRATIONS.find((m) => m.fromVersion === currentVersion);

    if (!nextMigration) {
      // Unknown version — no migration path exists
      return null;
    }

    migrated = nextMigration.migrate(migrated);
    currentVersion = nextMigration.toVersion;
    safety++;
  }

  if (currentVersion !== CURRENT_VERSION) {
    // Migration chain did not reach CURRENT_VERSION (shouldn't happen with valid chain)
    return null;
  }

  // Trust boundary: caller validates via validateStorageData / validateAppSettings.
  const trusted: unknown = migrated;
  return trusted as AppData;
}
