import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Check, Info, Grid3x3, Pencil } from 'lucide-react';
import { ScaleRectangle } from './ScaleRectangle';
import { ScaleReferenceShape } from './ScaleReferenceShape';
import { ScaleSetupGrid } from './ScaleSetupGrid';
import {
  MIN_FEET,
  MAX_FEET,
  PRESETS,
  REFERENCE_OBJECTS,
  type PresetOption,
} from './useStepSetScaleState';

interface DimensionInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const DimensionInput = ({ id, label, value, onChange }: DimensionInputProps) => (
  <div className="flex items-center gap-1.5">
    <Label htmlFor={id} className="text-muted-foreground text-xs whitespace-nowrap">
      {label}
    </Label>
    <Input
      id={id}
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      min={MIN_FEET}
      max={MAX_FEET}
      step="1"
      placeholder="20"
      className="h-8 w-16"
    />
    <span className="text-muted-foreground text-xs">ft</span>
  </div>
);

interface PresetChipsProps {
  activePresetId: string | null;
  onPick: (preset: PresetOption) => void;
}

const PresetChips = ({ activePresetId, onPick }: PresetChipsProps) => (
  <div className="flex flex-wrap items-center gap-1.5">
    {PRESETS.map((p) => {
      const active = activePresetId === p.id;
      return (
        <button
          key={p.id}
          type="button"
          onClick={() => onPick(p)}
          className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
            active
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
          }`}
        >
          {p.label}
        </button>
      );
    })}
  </div>
);

export interface UnlockedToolbarProps {
  widthInput: string;
  heightInput: string;
  canConfirm: boolean;
  activePresetId: string | null;
  onWidthChange: (v: string) => void;
  onHeightChange: (v: string) => void;
  onPickPreset: (preset: PresetOption) => void;
  onConfirm: () => void;
}

export const UnlockedToolbar = (props: UnlockedToolbarProps) => (
  <div className="bg-background flex flex-wrap items-center gap-x-3 gap-y-2 border-b px-3 py-2">
    <PresetChips activePresetId={props.activePresetId} onPick={props.onPickPreset} />
    <div className="flex items-center gap-2">
      <DimensionInput
        id="rect-width"
        label="W"
        value={props.widthInput}
        onChange={props.onWidthChange}
      />
      <span className="text-muted-foreground text-xs">×</span>
      <DimensionInput
        id="rect-height"
        label="H"
        value={props.heightInput}
        onChange={props.onHeightChange}
      />
    </div>
    <div className="ml-auto">
      <Button onClick={props.onConfirm} disabled={!props.canConfirm} size="sm" className="gap-1.5">
        <Check className="h-4 w-4" />
        Confirm Scale
      </Button>
    </div>
  </div>
);

export interface LockedToolbarProps {
  scale: number;
  showGrid: boolean;
  onToggleGrid: () => void;
  onEdit: () => void;
}

export const LockedToolbar = ({ scale, showGrid, onToggleGrid, onEdit }: LockedToolbarProps) => (
  <div className="bg-background flex flex-wrap items-center gap-2 border-b px-3 py-2">
    <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
      <Check className="h-3.5 w-3.5" />
      Scale set
      <span className="text-emerald-600/80">· 1 ft ≈ {(scale * 12).toFixed(1)} px</span>
    </div>
    <div className="ml-auto flex items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant={showGrid ? 'default' : 'outline'}
        onClick={onToggleGrid}
        className="h-7 gap-1.5"
      >
        <Grid3x3 className="h-3.5 w-3.5" />
        1-ft grid
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={onEdit}
        className="h-7 gap-1.5 text-xs"
      >
        <Pencil className="h-3.5 w-3.5" />
        Edit scale
      </Button>
    </div>
  </div>
);

export interface OpacityControlProps {
  value: number;
  onChange: (v: number) => void;
}

export const OpacityControl = ({ value, onChange }: OpacityControlProps) => (
  <div className="bg-background/95 supports-[backdrop-filter]:bg-background/75 absolute right-3 bottom-3 z-30 flex items-center gap-2 rounded-full border px-3 py-1.5 shadow-sm backdrop-blur">
    <Label htmlFor="image-opacity" className="text-muted-foreground text-[11px] font-medium">
      Image opacity
    </Label>
    <Slider
      id="image-opacity"
      value={[value * 100]}
      onValueChange={([v]) => onChange(v / 100)}
      min={20}
      max={100}
      step={5}
      className="w-28"
    />
    <span className="text-muted-foreground w-7 text-right text-[11px]">
      {Math.round(value * 100)}%
    </span>
  </div>
);

export const SetupHint = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-muted/50 text-muted-foreground flex items-start gap-2 rounded-md px-3 py-2 text-xs">
    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
    <p>{children}</p>
  </div>
);

export interface ScaleCanvasProps {
  imageAreaRef: React.RefObject<HTMLDivElement | null>;
  backgroundImage: string | null | undefined;
  imageOpacity: number;
  roomRect: { x: number; y: number; width: number; height: number };
  onRectChange: (rect: { x: number; y: number; width: number; height: number }) => void;
  disabled: boolean;
  labelText: string | undefined;
  pixelsPerInch: number;
  containerSize: { width: number; height: number };
  showReferences: boolean;
  showGrid: boolean;
  aspectRatio: number;
  toolbar: React.ReactNode;
  opacityControl: React.ReactNode;
}

export const ScaleCanvas = ({
  imageAreaRef,
  backgroundImage,
  imageOpacity,
  roomRect,
  onRectChange,
  disabled,
  labelText,
  pixelsPerInch,
  containerSize,
  showReferences,
  showGrid,
  aspectRatio,
  toolbar,
  opacityControl,
}: ScaleCanvasProps) => (
  <div className="bg-muted/30 overflow-hidden rounded-xl border">
    {toolbar}
    <div ref={imageAreaRef} className="relative aspect-4/3 min-h-[400px] w-full">
      {backgroundImage && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'top left',
            opacity: imageOpacity,
          }}
          aria-hidden="true"
        />
      )}
      {showGrid && pixelsPerInch > 0 && (
        <ScaleSetupGrid
          pixelsPerInch={pixelsPerInch}
          containerWidth={containerSize.width}
          containerHeight={containerSize.height}
        />
      )}
      <ScaleRectangle
        x={roomRect.x}
        y={roomRect.y}
        width={roomRect.width}
        height={roomRect.height}
        onChange={onRectChange}
        disabled={disabled}
        labelText={labelText}
        aspectRatio={aspectRatio}
      />
      {showReferences &&
        pixelsPerInch > 0 &&
        REFERENCE_OBJECTS.map((ref) => (
          <ScaleReferenceShape
            key={ref.key}
            shape={ref.shape}
            widthInches={ref.widthInches}
            heightInches={ref.heightInches}
            pixelsPerInch={pixelsPerInch}
            containerWidth={containerSize.width}
            containerHeight={containerSize.height}
            initialPercent={ref.initialPercent}
            label={ref.label}
            colorClass={ref.colorClass}
          />
        ))}
      {opacityControl}
    </div>
  </div>
);
