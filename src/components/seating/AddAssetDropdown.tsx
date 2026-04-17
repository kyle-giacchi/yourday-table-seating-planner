import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sofa } from 'lucide-react';
import type { RoomAssetType } from '@/types/seating';
import { ROOM_ASSET_PRESETS, ROOM_ASSET_CATEGORIES, formatAssetSize } from '@/constants/roomAssets';
import { useSeating } from '@/hooks/useSeating';
import { useToast } from '@/hooks/use-toast';
import { positionJitter } from '@/lib/utils';

interface AssetMenuItemProps {
  type: RoomAssetType;
  onAdd: (type: RoomAssetType) => void;
}

const AssetMenuItem = ({ type, onAdd }: AssetMenuItemProps) => {
  const preset = ROOM_ASSET_PRESETS[type];
  return (
    <DropdownMenuItem
      className="group hover:bg-accent/10 flex cursor-pointer items-center justify-between p-3"
      onClick={() => onAdd(type)}
    >
      <div className="text-sm font-medium">{preset.label}</div>
      <div className="text-muted-foreground group-hover:text-foreground text-xs">
        {formatAssetSize(preset)}
      </div>
    </DropdownMenuItem>
  );
};

export const AddAssetDropdown = () => {
  const { addAsset, selectAsset, zoomState } = useSeating();
  const { toast } = useToast();

  const addAssetFromType = (type: RoomAssetType) => {
    addAsset({
      type,
      x: Math.max(50, zoomState.centerX + positionJitter()),
      y: Math.max(50, zoomState.centerY + positionJitter()),
      rotation: 0,
    });
    // addAsset generates its own id; we can't pre-select by id here.
    // Clear any existing selection; user clicks the new asset to select it.
    selectAsset(null);
    toast({
      title: 'Asset Added',
      description: `${ROOM_ASSET_PRESETS[type].label} added to canvas`,
    });
  };

  const byCategory = (category: string) =>
    (Object.keys(ROOM_ASSET_PRESETS) as RoomAssetType[]).filter(
      (t) => ROOM_ASSET_PRESETS[t].category === category,
    );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-secondary-custom text-secondary-custom hover:bg-secondary-custom/10 hover:text-secondary-custom hover:border-secondary-custom"
        >
          <Sofa size={16} />
          Add Asset
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="bg-popover max-h-96 w-72 overflow-y-auto border shadow-xl"
        sideOffset={5}
      >
        {ROOM_ASSET_CATEGORIES.map((category, idx) => {
          const items = byCategory(category);
          if (items.length === 0) return null;
          return (
            <React.Fragment key={category}>
              {idx > 0 && <DropdownMenuSeparator />}
              <DropdownMenuLabel className="text-foreground text-sm font-semibold">
                {category}
              </DropdownMenuLabel>
              {items.map((type) => (
                <AssetMenuItem key={type} type={type} onAdd={addAssetFromType} />
              ))}
            </React.Fragment>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
