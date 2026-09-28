import type { AppData } from '@/types/appData';
import { defaultRepository, type DataRepository } from './DataRepository';

const SAVE_DEBOUNCE_MS = 300;

export interface ProjectSnapshot {
  data: AppData;
  /** Bumps whenever memory is replaced from storage (cross-tab write, import). */
  reloads: number;
}

/**
 * Owns the in-memory AppData document and is the only thing that writes it to
 * storage. Edits are debounced; `flush()` writes immediately. `reload()`
 * replaces memory from storage and drops any pending edit, so a stale save
 * can't clobber what another tab or an import just wrote.
 */
export const createProjectStore = (repo: DataRepository = defaultRepository) => {
  let snapshot: ProjectSnapshot = { data: repo.loadAppData(), reloads: 0 };
  let timer: ReturnType<typeof setTimeout> | null = null;
  const listeners = new Set<() => void>();

  const set = (next: ProjectSnapshot) => {
    snapshot = next;
    listeners.forEach((l) => l());
  };
  const cancel = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };
  const flush = () => {
    if (!timer) return;
    cancel();
    repo.saveAppData(snapshot.data);
  };
  const reload = () => {
    cancel();
    set({ data: repo.loadAppData(), reloads: snapshot.reloads + 1 });
  };

  return {
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    update: (fn: (data: AppData) => AppData) => {
      set({ ...snapshot, data: fn(snapshot.data) });
      cancel();
      timer = setTimeout(flush, SAVE_DEBOUNCE_MS);
    },
    flush,
    reload,
    /** Drop the pending edit. Call before wiping storage wholesale. */
    discard: cancel,
    exportJson: () => {
      flush();
      return repo.exportConfiguration();
    },
    importJson: (json: string) => {
      flush();
      const result = repo.importConfiguration(json);
      if (result.success) reload();
      return result;
    },
  };
};

export type ProjectStore = ReturnType<typeof createProjectStore>;
