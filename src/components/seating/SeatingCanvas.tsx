import React, { useRef, useCallback, useState, useEffect } from 'react';
import { useSeating } from '@/hooks/useSeating';
import { useCanvasDimensionsObserver } from '@/hooks/useCanvasDimensionsObserver';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import type { Table } from '@/types/seating';

import { useCanvasViewport } from './hooks/useCanvasViewport';
import { useCanvasDropZone } from './hooks/useCanvasDropZone';
import { SeatingTable } from './table/SeatingTable';
import { ZoomPanControls } from './controls/ZoomPanControls';
import { BoundariesLayer } from './layers/BoundariesLayer';
import { BackgroundLayer } from './layers/BackgroundLayer';
import { ScaleGridOverlay } from './layers/ScaleGridOverlay';
import { RoomAssetView } from './asset/RoomAssetView';
import type { RoomAsset } from '@/types/seating';
import type { CanvasPoint } from './types';

// ---------- Hook: rescale tables on canvas-size change ----------

interface CanvasDims {
  width: number;
  height: number;
}

const useRescaleTablesOnResize = (
  canvasDimensions: CanvasDims,
  tables: Table[],
  updateTable: (id: string, patch: Partial<Table>) => void,
) => {
  const prevRef = useRef<CanvasDims>({ width: 0, height: 0 });
  useEffect(() => {
    const prev = prevRef.current;
    const cur = canvasDimensions;
    const hasPrev = prev.width > 0 && prev.height > 0;
    const hasCur = cur.width > 0 && cur.height > 0;
    const sizeChanged =
      Math.abs(cur.width - prev.width) > 1 || Math.abs(cur.height - prev.height) > 1;

    if (hasPrev && hasCur && sizeChanged) {
      const sx = cur.width / prev.width;
      const sy = cur.height / prev.height;
      for (const table of tables) {
        updateTable(table.id, { x: Math.round(table.x * sx), y: Math.round(table.y * sy) });
      }
    }
    prevRef.current = { width: cur.width, height: cur.height };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only canvasDimensions should retrigger; other refs are mutable snapshots
  }, [canvasDimensions]);
};

// ---------- Hook: focus canvas on selected table ----------

const useFocusOnSelectedTable = (
  selectedTableId: string | null,
  tables: Table[],
  focusOnPoint: (x: number, y: number, zoom: number) => void,
  resetView: () => void,
) => {
  const prevSelectedRef = useRef<string | null>(null);
  useEffect(() => {
    if (selectedTableId && selectedTableId !== prevSelectedRef.current) {
      const table = tables.find((t) => t.id === selectedTableId);
      if (table) focusOnPoint(table.x, table.y, 2.0);
    } else if (!selectedTableId && prevSelectedRef.current) {
      resetView();
    }
    prevSelectedRef.current = selectedTableId;
  }, [selectedTableId, tables, focusOnPoint, resetView]);
};

// ---------- Hook: middle-click pan handlers ----------

interface PanHandlers {
  isPanning: boolean;
  handleMouseDown: (e: React.MouseEvent) => void;
  handleMouseMove: (e: React.MouseEvent) => void;
  handleMouseUp: () => void;
}

const useMiddleClickPan = (
  handlePanStart: (e: React.MouseEvent) => void,
  handlePanMove: (e: React.MouseEvent) => void,
  handlePanEnd: () => void,
): PanHandlers => {
  const [isPanning, setIsPanning] = useState(false);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 1) return;
      e.preventDefault();
      setIsPanning(true);
      handlePanStart(e);
    },
    [handlePanStart],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) handlePanMove(e);
    },
    [isPanning, handlePanMove],
  );

  const handleMouseUp = useCallback(() => {
    if (!isPanning) return;
    setIsPanning(false);
    handlePanEnd();
  }, [isPanning, handlePanEnd]);

  return { isPanning, handleMouseDown, handleMouseMove, handleMouseUp };
};

// ---------- Sub-components ----------

interface CanvasLayersProps {
  transformStyle: string;
  canvasDimensions: CanvasDims;
  backgroundImage: string | null | undefined;
  imageOpacity: number | undefined;
  tables: Table[];
  assets: RoomAsset[];
  highlightedTableId: string | null;
  screenToCanvas: (screenX: number, screenY: number, canvasRect: DOMRect) => CanvasPoint;
}

const CanvasLayers = (props: CanvasLayersProps) => (
  <div
    className="absolute inset-0 origin-top-left transition-transform duration-200"
    style={{ transform: props.transformStyle }}
  >
    <ScaleGridOverlay />
    <div className="absolute inset-0" style={{ zIndex: 1 }}>
      <BoundariesLayer canvasDimensions={props.canvasDimensions} />
    </div>
    <BackgroundLayer
      backgroundImage={props.backgroundImage ?? null}
      imageOpacity={props.imageOpacity ?? 1}
    />
    <div className="pointer-events-none absolute inset-0" style={{ zIndex: 25 }}>
      {props.assets.map((asset) => (
        <ErrorBoundary key={asset.id}>
          <RoomAssetView asset={asset} screenToCanvas={props.screenToCanvas} />
        </ErrorBoundary>
      ))}
    </div>
    <div className="pointer-events-none absolute inset-0" style={{ zIndex: 30 }}>
      {props.tables.map((table) => (
        <ErrorBoundary key={table.id}>
          <SeatingTable
            table={table}
            isHighlighted={props.highlightedTableId === table.id}
            screenToCanvas={props.screenToCanvas}
          />
        </ErrorBoundary>
      ))}
    </div>
  </div>
);

// ---------- Main component ----------

export const SeatingCanvas = () => {
  const canvasRef = useRef<HTMLDivElement>(null);

  const {
    seatingData,
    assets,
    selectedTableId,
    backgroundImageState,
    canvasDimensions,
    updateCanvasDimensions,
    updateTable,
    clearSelection,
  } = useSeating();

  const {
    transformStyle,
    screenToCanvas,
    focusOnPoint,
    handlePanStart,
    handlePanMove,
    handlePanEnd,
    resetView,
  } = useCanvasViewport(canvasRef);

  const { handleDrop, handleDragOver, handleDragLeave, highlightedTableId } = useCanvasDropZone({
    screenToCanvas,
  });

  useCanvasDimensionsObserver({ canvasRef, onDimensionsChange: updateCanvasDimensions });
  useRescaleTablesOnResize(canvasDimensions, seatingData.tables, updateTable);
  useFocusOnSelectedTable(selectedTableId, seatingData.tables, focusOnPoint, resetView);

  const pan = useMiddleClickPan(handlePanStart, handlePanMove, handlePanEnd);

  return (
    <>
      <div className="relative">
        <div className="absolute top-4 right-4 z-40 flex gap-2">
          <ZoomPanControls onResetPan={() => resetView()} />
        </div>

        <div
          ref={canvasRef}
          data-seating-canvas
          role="application"
          aria-label="Room layout canvas"
          aria-roledescription="Interactive room layout editor"
          className={`border-input bg-card relative aspect-4/3 min-h-[400px] w-full overflow-hidden border shadow-xs ${
            pan.isPanning ? 'cursor-grabbing' : ''
          }`}
          style={{ contain: 'layout paint' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) clearSelection();
          }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onMouseDown={pan.handleMouseDown}
          onMouseMove={pan.handleMouseMove}
          onMouseUp={pan.handleMouseUp}
          onMouseLeave={pan.handleMouseUp}
        >
          <CanvasLayers
            transformStyle={transformStyle}
            canvasDimensions={canvasDimensions}
            backgroundImage={backgroundImageState.backgroundImage}
            imageOpacity={backgroundImageState.imageOpacity}
            tables={seatingData.tables}
            assets={assets}
            highlightedTableId={highlightedTableId}
            screenToCanvas={screenToCanvas}
          />
        </div>
      </div>
    </>
  );
};
