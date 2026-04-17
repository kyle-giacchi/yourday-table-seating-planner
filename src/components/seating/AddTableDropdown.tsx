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
import { Badge } from '@/components/ui/badge';
import { Plus, Circle, Square } from 'lucide-react';
import type { TableSpec } from '@/types/seating';
import { TABLE_SPECIFICATIONS } from '@/types/seating';
import { useSeating } from '@/hooks/useSeating';
import { useToast } from '@/hooks/use-toast';
import { positionJitter } from '@/lib/utils';

const TableMenuItem = ({ spec, onAdd }: { spec: TableSpec; onAdd: (spec: TableSpec) => void }) => (
  <DropdownMenuItem
    className="group hover:bg-accent/10 flex cursor-pointer items-center justify-between p-3"
    onClick={() => onAdd(spec)}
  >
    <div className="flex items-center gap-3">
      {spec.shape === 'round' ? (
        <Circle size={16} className="text-primary-custom" />
      ) : (
        <Square size={16} className="text-secondary-custom" />
      )}
      <div>
        <div className="text-sm font-medium">{spec.size}</div>
        <div className="text-muted-foreground group-hover:text-foreground text-xs">
          {spec.commonUse}
        </div>
      </div>
    </div>
    <Badge variant="secondary" className="text-xs">
      {spec.defaultChairs}-{spec.maxChairs}
    </Badge>
  </DropdownMenuItem>
);

interface AddTableDropdownProps {
  variant?: 'outline' | 'primary';
}

export const AddTableDropdown = ({ variant = 'outline' }: AddTableDropdownProps = {}) => {
  const { addTable, zoomState } = useSeating();
  const { toast } = useToast();

  const addTableFromSpec = (spec: TableSpec) => {
    addTable({
      x: Math.max(50, zoomState.centerX + positionJitter()),
      y: Math.max(50, zoomState.centerY + positionJitter()),
      shape: spec.shape,
      capacity: spec.defaultChairs,
      guests: [],
      tableSize: spec.size,
      commonUse: spec.commonUse,
      defaultChairs: spec.defaultChairs,
      maxChairs: spec.maxChairs,
    });

    toast({
      title: 'Table Added',
      description: `${spec.size} table added to canvas`,
    });
  };

  const roundTables = TABLE_SPECIFICATIONS.filter((spec) => spec.shape === 'round');
  const rectangleTables = TABLE_SPECIFICATIONS.filter((spec) => spec.shape === 'rectangle');

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {variant === 'primary' ? (
            <Button size="sm" className="gap-1.5 shadow-sm">
              <Plus size={16} />
              Add Table
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="border-primary-custom text-primary-custom hover:bg-primary-custom/10 hover:text-primary-custom hover:border-primary-custom"
            >
              <Plus size={16} />
              Add Table
            </Button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="bg-popover max-h-96 w-80 overflow-y-auto border shadow-xl"
          sideOffset={5}
        >
          <DropdownMenuLabel className="text-foreground text-sm font-semibold">
            Round Tables
          </DropdownMenuLabel>
          {roundTables.map((spec) => (
            <TableMenuItem key={spec.size} spec={spec} onAdd={addTableFromSpec} />
          ))}

          <DropdownMenuSeparator />

          <DropdownMenuLabel className="text-foreground text-sm font-semibold">
            Rectangle Tables
          </DropdownMenuLabel>
          {rectangleTables.map((spec) => (
            <TableMenuItem key={spec.size} spec={spec} onAdd={addTableFromSpec} />
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
