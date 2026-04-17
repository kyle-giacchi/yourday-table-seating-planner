import React from 'react';
import { Trash2 } from 'lucide-react';

export interface AssetActionPillProps {
  onDelete: () => void;
  /** Width of the asset in px — used to horizontally center the pill. */
  assetWidth: number;
}

const PILL_OFFSET = 40;

export const AssetActionPill = ({ onDelete, assetWidth }: AssetActionPillProps) => {
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <div
      className="border-border bg-popover pointer-events-auto absolute z-40 flex -translate-x-1/2 items-center gap-1 rounded-full border px-3 py-1 shadow-lg"
      style={{
        left: assetWidth / 2,
        top: -PILL_OFFSET,
      }}
      data-asset-pill
    >
      <button
        type="button"
        onClick={handleDeleteClick}
        className="text-destructive hover:bg-destructive/10 hover:text-destructive flex h-7 w-7 items-center justify-center rounded-full transition-colors"
        aria-label="Delete asset"
        title="Delete"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
};
