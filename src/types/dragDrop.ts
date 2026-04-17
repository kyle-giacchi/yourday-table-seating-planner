import { safeJSONParse } from '@/lib/security';

export interface DragData {
  type: 'guest' | 'party';
  guestId?: string; // for guest drag
  partyName?: string; // for party drag, or guest drag originating from a seat
  partySize?: number; // for party drag
  /** When present, the drag originated from a seat at this table. Enables same-table reorder. */
  sourceTableId?: string;
}

export interface DropHandlerOptions {
  onSuccess?: (type: 'guest' | 'party', id: string) => void;
  onError?: (error: string) => void;
}

const parseGuestPayload = (data: Record<string, unknown>): DragData | null => {
  if (typeof data.guestId !== 'string' || data.guestId.length === 0) return null;
  const result: DragData = { type: 'guest', guestId: data.guestId };
  if (typeof data.partyName === 'string' && data.partyName.length > 0) {
    result.partyName = data.partyName;
  }
  return result;
};

const parsePartyPayload = (data: Record<string, unknown>): DragData | null => {
  if (typeof data.partyName !== 'string' || data.partyName.length === 0) return null;
  const result: DragData = { type: 'party', partyName: data.partyName };
  if (typeof data.partySize === 'number' && data.partySize > 0) {
    result.partySize = data.partySize;
  }
  return result;
};

// Type guard that validates and parses drag-and-drop JSON data.
// Returns a validated DragData object or null if invalid.
export const parseDragData = (jsonString: string): DragData | null => {
  const data = safeJSONParse<Record<string, unknown>>(jsonString);
  if (!data || typeof data !== 'object') return null;

  const result =
    data.type === 'guest'
      ? parseGuestPayload(data)
      : data.type === 'party'
        ? parsePartyPayload(data)
        : null;
  if (!result) return null;

  if (typeof data.sourceTableId === 'string' && data.sourceTableId.length > 0) {
    result.sourceTableId = data.sourceTableId;
  }
  return result;
};
