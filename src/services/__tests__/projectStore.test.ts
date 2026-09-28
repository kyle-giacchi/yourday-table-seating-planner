import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LocalStorageRepository } from '@/services/DataRepository';
import { createProjectStore } from '@/services/projectStore';
import type { Guest } from '@/types/seating';

const guest = (id: string): Guest =>
  ({ id, fullName: id, firstName: id, lastName: '', party: '', mealSelection: '' }) as Guest;

describe('projectStore', () => {
  const repo = new LocalStorageRepository();

  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  it('debounces saves and flush() writes immediately', () => {
    const store = createProjectStore(repo);
    store.update((d) => ({ ...d, guests: [guest('a')] }));
    expect(repo.loadAppData().guests).toHaveLength(0);
    store.flush();
    expect(repo.loadAppData().guests).toHaveLength(1);
  });

  it('exportJson includes an edit made inside the debounce window', () => {
    const store = createProjectStore(repo);
    store.update((d) => ({ ...d, guests: [guest('fresh')] }));
    expect(JSON.parse(store.exportJson()).guests[0].id).toBe('fresh');
  });

  it('a pending save cannot overwrite an import', () => {
    const store = createProjectStore(repo);
    const imported = { ...repo.loadAppData(), guests: [guest('imported')] };
    store.update((d) => ({ ...d, guests: [guest('stale')] }));

    expect(store.importJson(JSON.stringify(imported)).success).toBe(true);
    vi.runAllTimers();
    store.flush();

    expect(repo.loadAppData().guests.map((g) => g.id)).toEqual(['imported']);
    expect(store.getSnapshot().data.guests.map((g) => g.id)).toEqual(['imported']);
    expect(store.getSnapshot().reloads).toBe(1);
  });

  it('reload() drops the pending edit', () => {
    const store = createProjectStore(repo);
    store.update((d) => ({ ...d, guests: [guest('stale')] }));
    store.reload();
    vi.runAllTimers();
    expect(repo.loadAppData().guests).toHaveLength(0);
  });
});
