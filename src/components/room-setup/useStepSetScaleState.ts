import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSeating } from '@/hooks/useSeating';
import { toast } from '@/hooks/use-toast';
import { calculateReferenceScale } from '@/utils/roomUtils';

export const DEFAULT_FEET = 20;
export const MIN_FEET = 1;
export const MAX_FEET = 10000;

export interface PresetOption {
  id: string;
  label: string;
  width: number;
  height: number;
}

export const PRESETS: PresetOption[] = [
  { id: 'dance-floor', label: 'Dance floor 20×20', width: 20, height: 20 },
  { id: 'small-floor', label: 'Small floor 12×12', width: 12, height: 12 },
  { id: 'door', label: 'Door 3×7', width: 3, height: 7 },
  { id: 'parking', label: 'Parking 8×16', width: 8, height: 16 },
];

/**
 * Reference objects (real-world inches) shown live during scale editing and
 * verification. The user can drag them around the floor plan to sanity-check
 * that a known object looks the right size.
 */
export const REFERENCE_OBJECTS = [
  {
    key: 'table',
    shape: 'circle' as const,
    widthInches: 60,
    heightInches: 60,
    label: '60" table',
    initialPercent: { x: 30, y: 70 },
    colorClass: 'bg-primary/30 border-primary/70 text-primary-foreground',
  },
  {
    key: 'door',
    shape: 'rect' as const,
    widthInches: 36,
    heightInches: 84,
    label: 'Door 3×7',
    initialPercent: { x: 55, y: 70 },
    colorClass: 'bg-blue-400/30 border-blue-500/70 text-blue-900',
  },
  {
    key: 'person',
    shape: 'circle' as const,
    widthInches: 18,
    heightInches: 18,
    label: 'Person',
    initialPercent: { x: 75, y: 75 },
    colorClass: 'bg-emerald-400/40 border-emerald-600/70 text-emerald-950',
  },
];

export const useContainerSize = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, size };
};

const matchPreset = (width: number, height: number): string | null => {
  const found = PRESETS.find((p) => p.width === width && p.height === height);
  return found?.id ?? null;
};

interface ScaleInputs {
  widthInput: string;
  heightInput: string;
  parsedWidth: number;
  parsedHeight: number;
  hasValidDims: boolean;
  labelText: string | undefined;
  dimensionError: string | null;
  setWidthInput: (v: string) => void;
  setHeightInput: (v: string) => void;
  handleWidthChange: (value: string) => void;
  handleHeightChange: (value: string) => void;
}

const useScaleInputs = (
  initialWidth: number,
  initialHeight: number,
  updateRoomOutline: (patch: Record<string, unknown>) => void,
): ScaleInputs => {
  const [widthInput, setWidthInput] = useState(
    initialWidth > 0 ? String(initialWidth) : String(DEFAULT_FEET),
  );
  const [heightInput, setHeightInput] = useState(
    initialHeight > 0 ? String(initialHeight) : String(DEFAULT_FEET),
  );

  useEffect(() => {
    if (initialWidth > 0 && String(initialWidth) !== widthInput) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-way sync from external prop into editable input
      setWidthInput(String(initialWidth));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally one-way external sync
  }, [initialWidth]);
  useEffect(() => {
    if (initialHeight > 0 && String(initialHeight) !== heightInput) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-way sync from external prop into editable input
      setHeightInput(String(initialHeight));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally one-way external sync
  }, [initialHeight]);

  const handleWidthChange = useCallback(
    (value: string) => {
      setWidthInput(value);
      const num = parseFloat(value);
      if (!isNaN(num) && num >= MIN_FEET && num <= MAX_FEET) {
        updateRoomOutline({ realWorldWidth: num });
      }
    },
    [updateRoomOutline],
  );

  const handleHeightChange = useCallback(
    (value: string) => {
      setHeightInput(value);
      const num = parseFloat(value);
      if (!isNaN(num) && num >= MIN_FEET && num <= MAX_FEET) {
        updateRoomOutline({ realWorldHeight: num });
      }
    },
    [updateRoomOutline],
  );

  const parsedWidth = parseFloat(widthInput);
  const parsedHeight = parseFloat(heightInput);
  const widthInRange = !isNaN(parsedWidth) && parsedWidth >= MIN_FEET && parsedWidth <= MAX_FEET;
  const heightInRange =
    !isNaN(parsedHeight) && parsedHeight >= MIN_FEET && parsedHeight <= MAX_FEET;
  const hasValidDims = widthInRange && heightInRange;
  const labelText = hasValidDims ? `${parsedWidth}' × ${parsedHeight}'` : undefined;
  const dimensionError = (() => {
    if (widthInput === '' || heightInput === '') return null;
    if (!widthInRange || !heightInRange) {
      return `Enter a width and height between ${MIN_FEET} and ${MAX_FEET} ft.`;
    }
    return null;
  })();

  return {
    widthInput,
    heightInput,
    parsedWidth,
    parsedHeight,
    hasValidDims,
    labelText,
    dimensionError,
    setWidthInput,
    setHeightInput,
    handleWidthChange,
    handleHeightChange,
  };
};

export const useScaleStateAndHandlers = (containerSize: { width: number; height: number }) => {
  const {
    roomOutlineState,
    backgroundImageState,
    isReferenceLocked,
    updateRoomOutline,
    setImageOpacity,
    lockReference,
    unlockReference,
  } = useSeating();
  const navigate = useNavigate();

  const hasRect = roomOutlineState.width > 0 && roomOutlineState.height > 0;

  // Track whether the user has manually moved the rectangle. If they haven't,
  // we recenter on real-world dim changes so the rect stays visually placed.
  const userMovedRectRef = useRef(false);

  const inputs = useScaleInputs(
    roomOutlineState.realWorldWidth,
    roomOutlineState.realWorldHeight,
    updateRoomOutline,
  );

  useEffect(() => {
    if (!hasRect) {
      updateRoomOutline({
        x: 25,
        y: 20,
        width: 50,
        height: 50,
        realWorldWidth: DEFAULT_FEET,
        realWorldHeight: DEFAULT_FEET,
        isVisible: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot init on first render
  }, []);

  // Visual aspect ratio: stored h%/w% required for the rect to render with the
  // real-world aspect once container dims are known.
  const aspectRatio = useMemo(() => {
    const realW = roomOutlineState.realWorldWidth || 1;
    const realH = roomOutlineState.realWorldHeight || 1;
    const cW = containerSize.width;
    const cH = containerSize.height;
    if (cW <= 0 || cH <= 0) return 1;
    return cW / cH / (realW / realH);
  }, [
    containerSize.width,
    containerSize.height,
    roomOutlineState.realWorldWidth,
    roomOutlineState.realWorldHeight,
  ]);

  // Keep stored height% / centering in sync with the target aspect whenever
  // container or real-world dims change (skip while reference is locked).
  // Only patch when something actually drifts — `updateRoomOutline` returns a
  // new object reference each call, so unconditional patching loops forever.
  useEffect(() => {
    if (isReferenceLocked) return;
    if (!hasRect) return;
    if (containerSize.width <= 0 || containerSize.height <= 0) return;
    const maxWidth = Math.min(100, aspectRatio > 0 ? 100 / aspectRatio : 100);
    const targetWidth = Math.min(roomOutlineState.width, maxWidth);
    const targetHeight = targetWidth * aspectRatio;
    const recenter = !userMovedRectRef.current;
    const targetX = recenter ? (100 - targetWidth) / 2 : roomOutlineState.x;
    const targetY = recenter ? (100 - targetHeight) / 2 : roomOutlineState.y;
    const EPS = 0.5;
    const widthDrift = Math.abs(targetWidth - roomOutlineState.width) > EPS;
    const heightDrift = Math.abs(targetHeight - roomOutlineState.height) > EPS;
    const xDrift = Math.abs(targetX - roomOutlineState.x) > EPS;
    const yDrift = Math.abs(targetY - roomOutlineState.y) > EPS;
    if (!widthDrift && !heightDrift && !xDrift && !yDrift) return;
    const patch: Record<string, number> = { width: targetWidth, height: targetHeight };
    if (recenter) {
      patch.x = targetX;
      patch.y = targetY;
    }
    updateRoomOutline(patch);
  }, [
    aspectRatio,
    containerSize.width,
    containerSize.height,
    hasRect,
    isReferenceLocked,
    roomOutlineState.width,
    roomOutlineState.height,
    roomOutlineState.x,
    roomOutlineState.y,
    updateRoomOutline,
  ]);

  const handleRectChange = useCallback(
    (rect: { x: number; y: number; width: number; height: number }) => {
      userMovedRectRef.current = true;
      updateRoomOutline({ ...rect, isVisible: true });
    },
    [updateRoomOutline],
  );

  const handlePickPreset = useCallback(
    (preset: PresetOption) => {
      inputs.setWidthInput(String(preset.width));
      inputs.setHeightInput(String(preset.height));
      // Picking a preset resets the "user moved rect" flag so it re-centers.
      userMovedRectRef.current = false;
      updateRoomOutline({
        realWorldWidth: preset.width,
        realWorldHeight: preset.height,
      });
    },
    [inputs, updateRoomOutline],
  );

  const handleConfirm = useCallback(() => {
    lockReference();
    toast({
      title: 'Scale confirmed',
      description: 'Drag the reference shapes to verify everything looks right',
    });
  }, [lockReference]);

  const handleEdit = useCallback(() => unlockReference(), [unlockReference]);
  const handleDone = useCallback(() => navigate('/room-layout'), [navigate]);

  // Compute scale locally against the setup canvas (NOT the global seating
  // canvas). getReferenceScale() from context uses UIState canvasDimensions,
  // which is the layout canvas — wrong for this preview.
  const liveScale = useMemo(() => {
    if (containerSize.width <= 0 || containerSize.height <= 0) return 0;
    if (!inputs.hasValidDims) return 0;
    return calculateReferenceScale(roomOutlineState, containerSize);
  }, [containerSize, inputs.hasValidDims, roomOutlineState]);

  const activePresetId = useMemo(
    () => matchPreset(inputs.parsedWidth, inputs.parsedHeight),
    [inputs.parsedWidth, inputs.parsedHeight],
  );

  return {
    roomOutlineState,
    backgroundImageState,
    isReferenceLocked,
    widthInput: inputs.widthInput,
    heightInput: inputs.heightInput,
    canConfirm: hasRect && inputs.hasValidDims,
    labelText: inputs.labelText,
    dimensionError: inputs.dimensionError,
    liveScale,
    aspectRatio,
    activePresetId,
    setImageOpacity,
    handleRectChange,
    handleWidthChange: inputs.handleWidthChange,
    handleHeightChange: inputs.handleHeightChange,
    handlePickPreset,
    handleConfirm,
    handleEdit,
    handleDone,
  };
};
