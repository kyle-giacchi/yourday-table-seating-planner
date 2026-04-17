import React from 'react';
import { Settings } from 'lucide-react';

interface TableInfoPillProps {
  tableNumber: number;
  tableName: string;
  guestCount: number;
  defaultChairs: number;
  visible: boolean;
  onSettingsClick: (e: React.MouseEvent) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const getCapacityColor = (guestCount: number, defaultChairs: number) => {
  if (defaultChairs === 0) return 'text-muted-foreground';
  const ratio = guestCount / defaultChairs;
  if (ratio >= 1) return 'text-destructive';
  if (ratio >= 0.75) return 'text-warning';
  return 'text-success';
};

export const TableInfoPill = ({
  tableNumber,
  tableName,
  guestCount,
  defaultChairs,
  visible,
  onSettingsClick,
  onMouseEnter,
  onMouseLeave,
}: TableInfoPillProps) => {
  const hasCustomName = tableName !== `Table ${tableNumber}`;
  const capacityColor = getCapacityColor(guestCount, defaultChairs);

  return (
    <div
      className="pointer-events-auto absolute flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium whitespace-nowrap transition-opacity duration-300"
      style={{
        bottom: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        marginBottom: 6,
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        zIndex: 60,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {hasCustomName && (
        <>
          <span className="text-foreground">{tableName}</span>
          <span className="text-muted-foreground/50">·</span>
        </>
      )}
      <span className={capacityColor}>
        {guestCount}/{defaultChairs}
      </span>
      <button
        className="hover:bg-accent cursor-pointer rounded p-0.5 transition-colors"
        onClick={onSettingsClick}
        title="Table Settings"
        type="button"
      >
        <Settings className="text-muted-foreground h-3 w-3" />
      </button>
    </div>
  );
};
