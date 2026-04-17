import { describe, it, expect, vi, beforeEach } from 'vitest';
import { startGuestDrag, startPartyDrag } from '@/utils/dragUtils';
import { createMockGuest } from '@/test/helpers';

interface MockDataTransfer {
  data: Map<string, string>;
  effectAllowed: string;
  setData: (key: string, value: string) => void;
  setDragImage: ReturnType<typeof vi.fn>;
}

const createMockDragEvent = (): { dataTransfer: MockDataTransfer } => {
  const data = new Map<string, string>();
  return {
    dataTransfer: {
      data,
      effectAllowed: '',
      setData: (key: string, value: string) => {
        data.set(key, value);
      },
      setDragImage: vi.fn(),
    },
  };
};

describe('dragUtils', () => {
  beforeEach(() => {
    // jsdom provides document.createElement; ensure body exists for attachDragImage
    document.body.innerHTML = '';
  });

  describe('startGuestDrag', () => {
    it('writes a JSON guest payload, text fallback, and effectAllowed=move', () => {
      const guest = createMockGuest({
        id: 'guest-42',
        fullName: 'Alice Smith',
        party: 'Smith Family',
      });
      const e = createMockDragEvent() as unknown as React.DragEvent;
      startGuestDrag(e, guest);

      const dt = (e as unknown as { dataTransfer: MockDataTransfer }).dataTransfer;
      expect(dt.effectAllowed).toBe('move');
      expect(dt.data.get('text/plain')).toBe('guest-42');

      const json = JSON.parse(dt.data.get('application/json') ?? '{}');
      expect(json).toEqual({
        type: 'guest',
        guestId: 'guest-42',
        guestName: 'Alice Smith',
      });

      expect(dt.setDragImage).toHaveBeenCalledTimes(1);
    });

    it('JSON payload roundtrips through JSON.parse without loss', () => {
      const guest = createMockGuest({ id: 'g1', fullName: 'Bob' });
      const e = createMockDragEvent() as unknown as React.DragEvent;
      startGuestDrag(e, guest);

      const dt = (e as unknown as { dataTransfer: MockDataTransfer }).dataTransfer;
      const raw = dt.data.get('application/json');
      expect(raw).toBeDefined();
      expect(() => JSON.parse(raw as string)).not.toThrow();
    });
  });

  describe('startPartyDrag', () => {
    it('writes a JSON party payload, text fallback, and effectAllowed=move', () => {
      const e = createMockDragEvent() as unknown as React.DragEvent;
      startPartyDrag(e, 'Smith Family', 4);

      const dt = (e as unknown as { dataTransfer: MockDataTransfer }).dataTransfer;
      expect(dt.effectAllowed).toBe('move');
      expect(dt.data.get('text/plain')).toBe('Smith Family');

      const json = JSON.parse(dt.data.get('application/json') ?? '{}');
      expect(json).toEqual({
        type: 'party',
        partyName: 'Smith Family',
        partySize: 4,
      });
    });

    it('handles a party of size 1', () => {
      const e = createMockDragEvent() as unknown as React.DragEvent;
      startPartyDrag(e, 'Solo', 1);
      const dt = (e as unknown as { dataTransfer: MockDataTransfer }).dataTransfer;
      const json = JSON.parse(dt.data.get('application/json') ?? '{}');
      expect(json.partySize).toBe(1);
    });
  });
});
