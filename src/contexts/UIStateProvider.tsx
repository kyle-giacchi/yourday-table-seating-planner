import type { ReactNode } from 'react';
import { useState, useMemo, useCallback } from 'react';
import { useCanvasControls } from '@/hooks/useCanvasControls';
import { UIStateContext, type ManagementMode } from './UIStateContext';

interface UIStateProviderProps {
  children: ReactNode;
}

export const UIStateProvider = ({ children }: UIStateProviderProps) => {
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [managementMode, setManagementModeRaw] = useState<ManagementMode>('assignment');
  const [hoveredGuestId, setHoveredGuestId] = useState<string | null>(null);
  const [showGuestPositionsTableId, setShowGuestPositionsTableId] = useState<string | null>(null);
  const [guestPositionColorMap, setGuestPositionColorMap] = useState<Record<string, number>>({});
  const [showScaleGrid, setShowScaleGrid] = useState(false);
  const [pinAllPills, setPinAllPills] = useState(false);
  const [isDraggingGuest, setIsDraggingGuest] = useState(false);
  const [isDraggingSeated, setIsDraggingSeated] = useState(false);
  const [seatDragInfo, setSeatDragInfo] = useState<{
    partyName: string;
    sourceTableId: string;
  } | null>(null);
  const canvasControls = useCanvasControls();

  const selectTable = useCallback((id: string | null) => {
    setSelectedTableId(id);
    if (id !== null) setSelectedAssetId(null);
  }, []);

  const selectAsset = useCallback((id: string | null) => {
    setSelectedAssetId(id);
    if (id !== null) setSelectedTableId(null);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedTableId(null);
    setSelectedAssetId(null);
  }, []);

  const setManagementMode = useCallback((mode: ManagementMode) => {
    if (mode !== 'table-editor') {
      // Leaving table-editor — turn off guest positions overlay
      setShowGuestPositionsTableId(null);
      setGuestPositionColorMap({});
    }
    setManagementModeRaw(mode);
  }, []);

  const contextValue = useMemo(
    () => ({
      selectedTableId,
      selectedAssetId,
      selectTable,
      selectAsset,
      clearSelection,
      managementMode,
      setManagementMode,
      activeTab: canvasControls.activeTab,
      setActiveTab: canvasControls.setActiveTab,
      zoomState: canvasControls.zoomState,
      zoomControls: canvasControls.zoomControls,
      canvasDimensions: canvasControls.canvasDimensions,
      updateCanvasDimensions: canvasControls.updateCanvasDimensions,
      setZoom: canvasControls.setZoom,
      zoomIn: canvasControls.zoomIn,
      zoomOut: canvasControls.zoomOut,
      resetZoom: canvasControls.resetZoom,
      centerView: canvasControls.centerView,
      hoveredGuestId,
      setHoveredGuestId,
      showGuestPositionsTableId,
      setShowGuestPositionsTableId,
      guestPositionColorMap,
      setGuestPositionColorMap,
      showScaleGrid,
      setShowScaleGrid,
      pinAllPills,
      setPinAllPills,
      isDraggingGuest,
      setIsDraggingGuest,
      isDraggingSeated,
      setIsDraggingSeated,
      seatDragInfo,
      setSeatDragInfo,
    }),
    [
      selectedTableId,
      selectedAssetId,
      selectTable,
      selectAsset,
      clearSelection,
      managementMode,
      setManagementMode,
      hoveredGuestId,
      showGuestPositionsTableId,
      guestPositionColorMap,
      showScaleGrid,
      pinAllPills,
      isDraggingGuest,
      isDraggingSeated,
      seatDragInfo,
      canvasControls.activeTab,
      canvasControls.setActiveTab,
      canvasControls.zoomState,
      canvasControls.zoomControls,
      canvasControls.canvasDimensions,
      canvasControls.updateCanvasDimensions,
      canvasControls.setZoom,
      canvasControls.zoomIn,
      canvasControls.zoomOut,
      canvasControls.resetZoom,
      canvasControls.centerView,
    ],
  );

  return <UIStateContext.Provider value={contextValue}>{children}</UIStateContext.Provider>;
};
