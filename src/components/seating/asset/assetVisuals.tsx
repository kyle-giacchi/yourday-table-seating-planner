import React, { useId } from 'react';
import type { RoomAssetType } from '@/types/seating';
import { ROOM_ASSET_PRESETS, formatAssetSize } from '@/constants/roomAssets';

const fillClass = 'pointer-events-none absolute inset-0 h-full w-full';

export const SpeakerVisual = () => (
  <svg viewBox="0 0 20 20" preserveAspectRatio="xMidYMid meet" className={fillClass}>
    <rect
      x="1"
      y="1"
      width="18"
      height="18"
      rx="1"
      fill="#1f2937"
      stroke="#4b5563"
      strokeWidth="0.5"
    />
    <circle cx="10" cy="5" r="1.8" fill="#374151" stroke="#6b7280" strokeWidth="0.3" />
    <circle cx="10" cy="5" r="0.6" fill="#9ca3af" />
    <circle cx="10" cy="13" r="5" fill="#111827" stroke="#6b7280" strokeWidth="0.4" />
    <circle cx="10" cy="13" r="3.5" fill="#374151" />
    <circle cx="10" cy="13" r="1.2" fill="#9ca3af" />
  </svg>
);

export const DJVisual = () => (
  <svg viewBox="0 0 80 60" preserveAspectRatio="xMidYMid meet" className={fillClass}>
    <rect
      x="1"
      y="1"
      width="78"
      height="58"
      rx="2"
      fill="#1e293b"
      stroke="#64748b"
      strokeWidth="0.6"
    />
    <circle cx="18" cy="30" r="13" fill="#0f172a" stroke="#94a3b8" strokeWidth="0.8" />
    <circle cx="18" cy="30" r="10" fill="#1e293b" stroke="#475569" strokeWidth="0.3" />
    <circle cx="18" cy="30" r="1.6" fill="#fbbf24" />
    <circle cx="62" cy="30" r="13" fill="#0f172a" stroke="#94a3b8" strokeWidth="0.8" />
    <circle cx="62" cy="30" r="10" fill="#1e293b" stroke="#475569" strokeWidth="0.3" />
    <circle cx="62" cy="30" r="1.6" fill="#fbbf24" />
    <rect
      x="34"
      y="14"
      width="12"
      height="32"
      rx="1"
      fill="#334155"
      stroke="#64748b"
      strokeWidth="0.4"
    />
    <circle cx="40" cy="19" r="1.1" fill="#94a3b8" />
    <circle cx="40" cy="24" r="1.1" fill="#94a3b8" />
    <rect x="38.6" y="29" width="2.8" height="12" rx="0.3" fill="#475569" />
    <rect x="38" y="34" width="4" height="1.2" fill="#fbbf24" />
  </svg>
);

interface DanceFloorVisualProps {
  type: 'dance-floor-large' | 'dance-floor-medium';
  rotation: number;
}

export const DanceFloorVisual = ({ type, rotation }: DanceFloorVisualProps) => {
  const rawId = useId();
  const patternId = `parquet-${rawId.replace(/:/g, '')}`;
  const sizeLabel = formatAssetSize(ROOM_ASSET_PRESETS[type]);

  return (
    <>
      <svg className={fillClass} preserveAspectRatio="none" viewBox="0 0 100 100">
        <defs>
          <pattern id={patternId} x="0" y="0" width="25" height="25" patternUnits="userSpaceOnUse">
            <rect width="25" height="25" fill="#fde68a" />
            <rect x="0" y="0" width="12.5" height="12.5" fill="#f59e0b" opacity="0.55" />
            <rect x="12.5" y="12.5" width="12.5" height="12.5" fill="#f59e0b" opacity="0.55" />
            <line
              x1="0"
              y1="12.5"
              x2="25"
              y2="12.5"
              stroke="#b45309"
              strokeWidth="0.4"
              opacity="0.5"
            />
            <line
              x1="12.5"
              y1="0"
              x2="12.5"
              y2="25"
              stroke="#b45309"
              strokeWidth="0.4"
              opacity="0.5"
            />
          </pattern>
        </defs>
        <rect width="100" height="100" fill={`url(#${patternId})`} />
      </svg>
      <div
        className="pointer-events-none relative z-10 rounded border border-yellow-700/40 bg-yellow-50/95 px-2.5 py-1 text-sm font-semibold text-yellow-900 shadow-sm"
        style={{ transform: `rotate(${-rotation}deg)` }}
      >
        {sizeLabel}
      </div>
    </>
  );
};

// eslint-disable-next-line react-refresh/only-export-components -- tiny type predicate kept next to the visuals it describes; splitting it is more noise than HMR gain
export const hasCustomVisual = (type: RoomAssetType): boolean =>
  type === 'speaker' ||
  type === 'dj-setup' ||
  type === 'dance-floor-large' ||
  type === 'dance-floor-medium';
