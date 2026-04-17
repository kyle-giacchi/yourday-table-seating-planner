import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { safeLocalStorage, detectStorageStatus } from '@/lib/safeStorage';

describe('safeLocalStorage', () => {
  // Clear storage before every test so tests are isolated
  beforeEach(() => {
    localStorage.clear();
  });

  // -------------------------------------------------------------------
  // getItem
  // -------------------------------------------------------------------

  describe('getItem', () => {
    it('returns null for a key that does not exist', () => {
      expect(safeLocalStorage.getItem('no-such-key')).toBeNull();
    });

    it('returns the value that was previously set', () => {
      localStorage.setItem('test-key', 'hello');
      expect(safeLocalStorage.getItem('test-key')).toBe('hello');
    });
  });

  // -------------------------------------------------------------------
  // setItem
  // -------------------------------------------------------------------

  describe('setItem', () => {
    it('stores a plain string value and returns true', () => {
      const result = safeLocalStorage.setItem('plain', 'just a string');
      expect(result).toBe(true);
      expect(localStorage.getItem('plain')).toBe('just a string');
    });

    it('stores a valid JSON object and returns true', () => {
      const payload = JSON.stringify({ foo: 'bar', count: 1 });
      const result = safeLocalStorage.setItem('json-key', payload);
      expect(result).toBe(true);
      expect(localStorage.getItem('json-key')).toBe(payload);
    });

    it('rejects a JSON payload that exceeds the 5 MB size limit and returns false', () => {
      // Build a string just over 5 MB when JSON-stringified.
      // "a" repeated 5_242_880 times → JSON becomes '{"d":"aaa..."}' which is
      // longer than 5 MB so validateStorageData will reject it.
      const bigString = 'a'.repeat(5 * 1024 * 1024 + 100);
      const payload = JSON.stringify({ d: bigString });
      const result = safeLocalStorage.setItem('big-key', payload);
      expect(result).toBe(false);
      // The key should NOT have been written
      expect(localStorage.getItem('big-key')).toBeNull();
    });
  });

  // -------------------------------------------------------------------
  // removeItem
  // -------------------------------------------------------------------

  describe('removeItem', () => {
    it('removes a key and returns true', () => {
      localStorage.setItem('remove-me', 'value');
      const result = safeLocalStorage.removeItem('remove-me');
      expect(result).toBe(true);
      expect(localStorage.getItem('remove-me')).toBeNull();
    });

    it('returns true even when the key did not exist', () => {
      expect(safeLocalStorage.removeItem('ghost-key')).toBe(true);
    });
  });

  // -------------------------------------------------------------------
  // clear
  // -------------------------------------------------------------------

  describe('clear', () => {
    it('clears all keys and returns true', () => {
      localStorage.setItem('key1', 'val1');
      localStorage.setItem('key2', 'val2');

      const result = safeLocalStorage.clear();

      expect(result).toBe(true);
      expect(localStorage.getItem('key1')).toBeNull();
      expect(localStorage.getItem('key2')).toBeNull();
    });

    it('returns true even when storage is already empty', () => {
      expect(safeLocalStorage.clear()).toBe(true);
    });
  });
});

describe('detectStorageStatus', () => {
  const realLocalStorage = window.localStorage;

  afterEach(() => {
    // Restore whatever was replaced during the test
    Object.defineProperty(window, 'localStorage', {
      value: realLocalStorage,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  it('returns "available" when a round-trip succeeds', () => {
    expect(detectStorageStatus()).toBe('available');
  });

  it('returns "blocked" when setItem throws (private mode / quota)', () => {
    const throwing = {
      setItem: vi.fn(() => {
        throw new DOMException('quota exceeded', 'QuotaExceededError');
      }),
      removeItem: vi.fn(),
      getItem: vi.fn(() => null),
      clear: vi.fn(),
      key: vi.fn(() => null),
      length: 0,
    };
    Object.defineProperty(window, 'localStorage', {
      value: throwing,
      configurable: true,
    });

    expect(detectStorageStatus()).toBe('blocked');
  });

  it('returns "unavailable" when window.localStorage is missing', () => {
    Object.defineProperty(window, 'localStorage', {
      value: undefined,
      configurable: true,
    });
    expect(detectStorageStatus()).toBe('unavailable');
  });
});
