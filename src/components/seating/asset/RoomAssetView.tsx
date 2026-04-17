import React, { useCallback } from 'react';
import type { RoomAsset } from '@/types/seating';
import { useSeating } from '@/hooks/useSeating';
import { useRoomAssetDimensions } from '../hooks/useRoomAssetDimensions';
import { ROOM_ASSET_STYLES } from './roomAssetStyles';
import { AssetActionPill } from './AssetActionPill';
import { RotationHandle } from './RotationHandle';
import { SpeakerVisual, DJVisual, DanceFloorVisual, hasCustomVisual } from './assetVisuals';
import type { CanvasPoint } from '../types';
import { useRoomAssetDrag } from './useRoomAssetDrag';

export interface RoomAssetViewProps {
  asset: RoomAsset;
  screenToCanvas: (screenX: number, screenY: number, canvasRect: DOMRect) => CanvasPoint;
}

const RoomAssetViewComponent = ({ asset, screenToCanvas }: RoomAssetViewProps) => {
  const { selectedAssetId, selectAsset, removeAsset, updateAsset, getTableScale } = useSeating();
  const dimensions = useRoomAssetDimensions({ type: asset.type, getTableScale });
  const style = ROOM_ASSET_STYLES[asset.type];
  const isSelected = selectedAssetId === asset.id;
  const useCustomVisual = hasCustomVisual(asset.type);

  const { isDragging, wasDragged, handleMouseDown } = useRoomAssetDrag({
    assetId: asset.id,
    assetDimensions: dimensions,
    screenToCanvas,
  });

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      handleMouseDown(e, asset.x, asset.y);
    },
    [handleMouseDown, asset.x, asset.y],
  );

  // No manual useCallback here: react-compiler can auto-memoize this handler
  // cleanly, and manual memo conflicts with `wasDragged.current` ref access.
  const onMouseUp = (e: React.MouseEvent) => {
    if (!wasDragged.current) {
      e.stopPropagation();
      selectAsset(asset.id);
    }
  };

  const handleRotationChange = useCallback(
    (nextRotation: number) => {
      updateAsset(asset.id, { rotation: nextRotation });
    },
    [updateAsset, asset.id],
  );

  const handleDelete = useCallback(() => {
    removeAsset(asset.id);
  }, [removeAsset, asset.id]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectAsset(asset.id);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        selectAsset(null);
      }
    },
    [selectAsset, asset.id],
  );

  return (
    <div
      data-asset-id={asset.id}
      role="button"
      tabIndex={0}
      aria-label={`Room asset: ${asset.type}`}
      aria-selected={isSelected}
      className={`pointer-events-auto absolute cursor-pointer overflow-hidden border-2 select-none ${style.background} ${style.border} ${style.textColor} focus-visible:ring-primary flex items-center justify-center text-xs font-medium transition-shadow duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden ${
        isSelected ? 'ring-primary shadow-lg ring-2 ring-offset-1' : 'shadow-sm'
      } ${isDragging ? 'z-20' : ''}`}
      style={{
        left: asset.x,
        top: asset.y,
        width: dimensions.width,
        height: dimensions.height,
        transform: `rotate(${asset.rotation}deg)`,
        transformOrigin: 'center center',
      }}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onKeyDown={handleKeyDown}
    >
      {useCustomVisual ? (
        <>
          {asset.type === 'speaker' && <SpeakerVisual />}
          {asset.type === 'dj-setup' && <DJVisual />}
          {(asset.type === 'dance-floor-large' || asset.type === 'dance-floor-medium') && (
            <DanceFloorVisual type={asset.type} rotation={asset.rotation} />
          )}
        </>
      ) : (
        style.shortLabel
      )}
      {isSelected && (
        <>
          <AssetActionPill onDelete={handleDelete} assetWidth={dimensions.width} />
          <RotationHandle assetWidth={dimensions.width} onChange={handleRotationChange} />
        </>
      )}
    </div>
  );
};

export const RoomAssetView = React.memo(RoomAssetViewComponent);
