import type { Guest } from '@/types/seating';

/**
 * Creates a compact, fully-opaque drag ghost chip and attaches it to the drag event.
 * The chip is appended offscreen, registered via setDragImage, then removed after
 * the browser has captured its snapshot (next animation frame).
 */
const attachDragImage = (e: React.DragEvent, label: string, sublabel?: string): void => {
  const chip = document.createElement('div');
  chip.style.cssText = [
    'position:fixed',
    'top:-9999px',
    'left:-9999px',
    'display:flex',
    'align-items:center',
    'gap:6px',
    'padding:6px 12px',
    'background:#ffffff',
    'border:1.5px solid #e2e8f0',
    'border-radius:8px',
    'box-shadow:0 4px 12px rgba(0,0,0,0.15)',
    'font-family:inherit',
    'font-size:13px',
    'font-weight:500',
    'color:#111827',
    'white-space:nowrap',
    'pointer-events:none',
    'opacity:1',
  ].join(';');

  const dot = document.createElement('span');
  dot.style.cssText =
    'width:8px;height:8px;border-radius:50%;background:var(--primary,#6366f1);flex-shrink:0';
  chip.appendChild(dot);

  const text = document.createElement('span');
  text.textContent = sublabel ? `${label} · ${sublabel}` : label;
  chip.appendChild(text);

  document.body.appendChild(chip);
  e.dataTransfer.setDragImage(chip, 0, chip.offsetHeight / 2);
  requestAnimationFrame(() => document.body.removeChild(chip));
};

/**
 * Standard drag-start handler for a single guest.
 *
 * When sourceTableId is provided (i.e. the guest is currently seated at a table),
 * the payload also carries the guest's party so same-table drop handlers can move
 * the whole party block together.
 *
 * Sets:
 *  - application/json — primary payload consumed by drop handlers via parseDragData()
 *  - text/plain       — legacy fallback (guest ID only) per project conventions
 *
 * effectAllowed is set to 'move' because we always relocate, never copy, guests.
 */
export const startGuestDrag = (e: React.DragEvent, guest: Guest, sourceTableId?: string): void => {
  const payload: Record<string, unknown> = {
    type: 'guest',
    guestId: guest.id,
    guestName: guest.fullName,
  };
  if (sourceTableId) {
    payload.sourceTableId = sourceTableId;
    payload.partyName = guest.party;
  }
  e.dataTransfer.setData('application/json', JSON.stringify(payload));
  e.dataTransfer.setData('text/plain', guest.id);
  e.dataTransfer.effectAllowed = 'move';
  attachDragImage(e, guest.fullName, guest.party !== guest.fullName ? guest.party : undefined);
};

/**
 * Standard drag-start handler for a party (group of guests).
 *
 * Sets:
 *  - application/json — primary payload consumed by drop handlers via parseDragData()
 *  - text/plain       — legacy fallback (party name) per project conventions
 *
 * effectAllowed is set to 'move' because we always relocate parties, never copy them.
 */
export const startPartyDrag = (
  e: React.DragEvent,
  partyName: string,
  guestCount: number,
  sourceTableId?: string,
): void => {
  const payload: Record<string, unknown> = {
    type: 'party',
    partyName,
    partySize: guestCount,
  };
  if (sourceTableId) payload.sourceTableId = sourceTableId;
  e.dataTransfer.setData('application/json', JSON.stringify(payload));
  e.dataTransfer.setData('text/plain', partyName);
  e.dataTransfer.effectAllowed = 'move';
  attachDragImage(e, partyName, `${guestCount} guests`);
};
