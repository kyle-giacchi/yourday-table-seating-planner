import { createContext, useContext } from 'react';
import type { ZoomState, ZoomControls } from '@/hooks/useCanvasControls';

export type ManagementMode = 'assignment' | 'table-editor';

export interface UIStateContextType {
  selectedTableId: string | null;
  selectedAssetId: string | null;
  selectTable: (id: string | null) => void;
  selectAsset: (id: string | null) => void;
  clearSelection: () => void;
  managementMode: ManagementMode;
  setManagementMode: (mode: ManagementMode) => void;
  activeTab: 'image' | 'room';
  setActiveTab: (tab: 'image' | 'room') => void;
  zoomState: ZoomState;
  zoomControls: ZoomControls;
  canvasDimensions: { width: number; height: number };
  updateCanvasDimensions: (width: number, height: number) => void;
  setZoom: (level: number, centerX?: number, centerY?: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  centerView: () => void;
  hoveredGuestId: string | null;
  setHoveredGuestId: (id: string | null) => void;
  showGuestPositionsTableId: string | null;
  setShowGuestPositionsTableId: (id: string | null) => void;
  /** Snapshot of guestId → colorIndex, frozen when the positions toggle is activated */
  guestPositionColorMap: Record<string, number>;
  setGuestPositionColorMap: (map: Record<string, number>) => void;
  showScaleGrid: boolean;
  setShowScaleGrid: (show: boolean) => void;
  pinAllPills: boolean;
  setPinAllPills: (show: boolean) => void;
  /** True while the user is dragging a guest or party card from the assignment panel */
  isDraggingGuest: boolean;
  setIsDraggingGuest: (dragging: boolean) => void;
  /** True while the user is dragging a guest/party that is currently seated at a table */
  isDraggingSeated: boolean;
  setIsDraggingSeated: (dragging: boolean) => void;
  /** Metadata about the active seated drag (for landing-zone preview) */
  seatDragInfo: { partyName: string; sourceTableId: string } | null;
  setSeatDragInfo: (info: { partyName: string; sourceTableId: string } | null) => void;
}

export const UIStateContext = createContext<UIStateContextType | undefined>(undefined);

export const useUIState = () => {
  const context = useContext(UIStateContext);
  if (!context) {
    throw new Error('useUIState must be used within a UIStateProvider');
  }
  return context;
};
