import { validateStorageData } from './security';

/**
 * Probe localStorage availability. Returns:
 *  - `available`  : a write/read/delete round-trip succeeded
 *  - `unavailable`: no window.localStorage (SSR, sandboxed iframe, etc.)
 *  - `blocked`    : localStorage present but setItem threw (private mode,
 *                    quota exceeded, or cookies disabled)
 */
export type StorageStatus = 'available' | 'unavailable' | 'blocked';

export const detectStorageStatus = (): StorageStatus => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return 'unavailable';
  } catch {
    return 'unavailable';
  }
  const probeKey = '__storage_probe__';
  try {
    window.localStorage.setItem(probeKey, '1');
    window.localStorage.removeItem(probeKey);
    return 'available';
  } catch {
    return 'blocked';
  }
};

// Safe localStorage wrapper for Cloudflare Workers compatibility
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem(key);
      }
      return null;
    } catch {
      return null;
    }
  },

  setItem: (key: string, value: string): boolean => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        // Enforce the 5MB storage cap on JSON-encoded *objects*. JSON primitives
        // (booleans, numbers, null, plain strings) and non-JSON strings bypass
        // validation — they're always tiny and the size cap exists to catch
        // runaway object payloads, not single-flag writes like "true" or "1".
        try {
          const parsed = JSON.parse(value);
          if (parsed !== null && typeof parsed === 'object' && !validateStorageData(parsed)) {
            return false;
          }
        } catch {
          // Non-JSON strings are allowed through without size validation
        }

        localStorage.setItem(key, value);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  removeItem: (key: string): boolean => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(key);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  clear: (): boolean => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.clear();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },
};

// Safe window operations
export const safeWindow = {
  confirm: (message: string): boolean => {
    try {
      if (typeof window !== 'undefined' && window.confirm) {
        // Native browser dialogs render plain text — no XSS risk
        return window.confirm(message);
      }
      return true;
    } catch {
      return true;
    }
  },

  alert: (message: string): void => {
    try {
      if (typeof window !== 'undefined' && window.alert) {
        // Native browser dialogs render plain text — no XSS risk
        window.alert(message);
      }
    } catch {
      // Intentionally empty
    }
  },
};
