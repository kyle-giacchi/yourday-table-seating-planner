import { useCallback } from 'react';
import { useTableAssignment } from '@/hooks/useTableAssignment';
import type { DropHandlerOptions } from '@/types/dragDrop';
import { parseDragData, type DragData } from '@/types/dragDrop';

const dispatchAssignment = async (
  data: DragData,
  tableId: string,
  assignParty: (name: string, id: string) => Promise<boolean>,
  assignGuest: (id: string, tableId: string) => Promise<boolean>,
  options?: DropHandlerOptions,
): Promise<boolean> => {
  if (data.type === 'party' && data.partyName) {
    const success = await assignParty(data.partyName, tableId);
    if (success) options?.onSuccess?.('party', data.partyName);
    return success;
  }
  if (data.type === 'guest' && data.guestId) {
    const success = await assignGuest(data.guestId, tableId);
    if (success) options?.onSuccess?.('guest', data.guestId);
    return success;
  }
  options?.onError?.('Invalid drag data structure');
  return false;
};

export const useDragDropHandler = (options?: DropHandlerOptions) => {
  const { assignGuestWithCapacityCheck, assignPartyWithCapacityCheck } = useTableAssignment();

  const handleDrop = useCallback(
    async (e: React.DragEvent, tableId: string): Promise<boolean> => {
      e.preventDefault();
      e.stopPropagation();

      try {
        const jsonData = e.dataTransfer.getData('application/json');
        if (jsonData) {
          const data = parseDragData(jsonData);
          if (!data) {
            options?.onError?.('Invalid drag data');
            return false;
          }
          return dispatchAssignment(
            data,
            tableId,
            assignPartyWithCapacityCheck,
            assignGuestWithCapacityCheck,
            options,
          );
        }

        // Fallback for legacy text/plain data (guest ID only)
        const guestId = e.dataTransfer.getData('text/plain');
        if (guestId) {
          const success = await assignGuestWithCapacityCheck(guestId, tableId);
          if (success) options?.onSuccess?.('guest', guestId);
          return success;
        }

        options?.onError?.('No valid drag data found');
        return false;
      } catch (error) {
        console.error('useDragDropHandler - Error processing drop:', error);
        options?.onError?.('Error processing drop data');
        return false;
      }
    },
    [assignGuestWithCapacityCheck, assignPartyWithCapacityCheck, options],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return { handleDrop, handleDragOver };
};
