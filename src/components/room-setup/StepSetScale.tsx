import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Info } from 'lucide-react';
import {
  LockedToolbar,
  OpacityControl,
  ScaleCanvas,
  SetupHint,
  UnlockedToolbar,
} from './StepSetScaleParts';
import { useContainerSize, useScaleStateAndHandlers } from './useStepSetScaleState';

interface StepSetScaleProps {
  onBack: () => void;
}

export const StepSetScale = ({ onBack }: StepSetScaleProps) => {
  const { ref: imageAreaRef, size: containerSize } = useContainerSize();
  const state = useScaleStateAndHandlers(containerSize);
  const [showGrid, setShowGrid] = useState(false);

  if (!state.backgroundImageState.backgroundImage) {
    return (
      <div className="text-muted-foreground flex h-full items-center justify-center">
        <p>No image uploaded. Go back to Step 1 to upload a floor plan.</p>
      </div>
    );
  }

  const opacity = state.backgroundImageState.imageOpacity ?? 1;

  const toolbar = state.isReferenceLocked ? (
    <LockedToolbar
      scale={state.liveScale}
      showGrid={showGrid}
      onToggleGrid={() => setShowGrid((v) => !v)}
      onEdit={state.handleEdit}
    />
  ) : (
    <UnlockedToolbar
      widthInput={state.widthInput}
      heightInput={state.heightInput}
      canConfirm={state.canConfirm}
      activePresetId={state.activePresetId}
      onWidthChange={state.handleWidthChange}
      onHeightChange={state.handleHeightChange}
      onPickPreset={state.handlePickPreset}
      onConfirm={state.handleConfirm}
    />
  );

  return (
    <div className="space-y-3">
      {!state.isReferenceLocked && (
        <SetupHint>
          Pick a preset or enter the real-world size of any feature you can see in your floor plan
          (a dance floor, a doorway, a parking space). Then drag the orange rectangle to cover that
          feature exactly.
        </SetupHint>
      )}

      {!state.isReferenceLocked && state.dimensionError && (
        <div className="border-destructive/30 bg-destructive/10 text-destructive flex items-start gap-2 rounded-md border px-3 py-2 text-xs">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p>{state.dimensionError}</p>
        </div>
      )}

      <ScaleCanvas
        imageAreaRef={imageAreaRef}
        backgroundImage={state.backgroundImageState.backgroundImage}
        imageOpacity={opacity}
        roomRect={state.roomOutlineState}
        onRectChange={state.handleRectChange}
        disabled={state.isReferenceLocked}
        labelText={state.labelText}
        pixelsPerInch={state.liveScale}
        containerSize={containerSize}
        showReferences={state.liveScale > 0}
        showGrid={state.isReferenceLocked && showGrid}
        aspectRatio={state.aspectRatio}
        toolbar={toolbar}
        opacityControl={<OpacityControl value={opacity} onChange={state.setImageOpacity} />}
      />

      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        {state.isReferenceLocked && (
          <Button onClick={state.handleDone} size="lg" className="gap-2">
            Done — Go to Layout
          </Button>
        )}
      </div>
    </div>
  );
};
