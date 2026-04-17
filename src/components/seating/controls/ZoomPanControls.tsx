import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { useSeating } from '@/hooks/useSeating';

interface ZoomPanControlsProps {
  /** Optional callback to reset the pan offset back to (0, 0). */
  onResetPan?: () => void;
}

export const ZoomPanControls = ({ onResetPan }: ZoomPanControlsProps) => {
  const { zoomState, zoomIn, zoomOut, resetZoom } = useSeating();

  const zoomPercentage = Math.round(zoomState.level * 100);

  const handleReset = useCallback(() => {
    resetZoom();
    if (onResetPan) {
      onResetPan();
    }
  }, [resetZoom, onResetPan]);

  return (
    <div className="flex items-center gap-2 rounded-lg border bg-white p-2 shadow-xs">
      <Button
        variant="outline"
        size="sm"
        onClick={zoomOut}
        disabled={zoomState.level <= 0.8}
        title="Zoom out"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>

      <span className="min-w-[52px] text-center text-sm font-medium tabular-nums">
        {zoomPercentage}%
      </span>

      <Button
        variant="outline"
        size="sm"
        onClick={zoomIn}
        disabled={zoomState.level >= 4.0}
        title="Zoom in"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>

      <Button variant="outline" size="sm" onClick={handleReset} title="Reset zoom and pan">
        <RotateCcw className="h-4 w-4" />
      </Button>
    </div>
  );
};
