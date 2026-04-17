import { useSeatingData } from '@/contexts/SeatingDataContext';
import { useUIState } from '@/contexts/UIStateContext';
import { useRoom } from '@/contexts/RoomContext';

export const useSeating = () => {
  const seatingData = useSeatingData();
  const uiState = useUIState();
  const room = useRoom();

  return {
    ...seatingData,
    ...uiState,
    ...room,
    // C2: updateCanvasDimensionsForRoom removed — RoomContext reads from UIStateContext now
  };
};
