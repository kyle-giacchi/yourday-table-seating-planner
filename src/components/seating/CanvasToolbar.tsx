import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Grid3X3, Tag, Users, Table as TableIcon, ImagePlus, Pencil } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AddTableDropdown } from './AddTableDropdown';
import { AddAssetDropdown } from './AddAssetDropdown';
import { useSeating } from '@/hooks/useSeating';
import { cn } from '@/lib/utils';

type ToggleProps = {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  title?: string;
};

const SegmentedToggle = ({ active, disabled, onClick, icon, label, title }: ToggleProps) => (
  <button
    type="button"
    aria-pressed={active}
    disabled={disabled}
    onClick={onClick}
    title={title}
    className={cn(
      'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-150',
      'focus-visible:ring-primary focus-visible:ring-2 focus-visible:outline-hidden',
      disabled && 'cursor-not-allowed opacity-40',
      !disabled && active && 'bg-background text-foreground shadow-sm',
      !disabled && !active && 'text-muted-foreground hover:text-foreground',
    )}
  >
    {icon}
    {label}
  </button>
);

export const CanvasToolbar = () => {
  const navigate = useNavigate();
  const {
    backgroundImageState,
    isReferenceLocked,
    showScaleGrid,
    setShowScaleGrid,
    pinAllPills,
    setPinAllPills,
    seatingData,
  } = useSeating();

  const hasImage = backgroundImageState.backgroundImage !== null;

  const assignedGuests = seatingData.tables.reduce((sum, t) => sum + t.guests.length, 0);
  const totalGuests = assignedGuests + seatingData.unassignedGuests.length;
  const totalTables = seatingData.tables.length;

  const setupLabel = hasImage ? 'Edit Image' : 'Upload Background';
  const SetupIcon = hasImage ? Pencil : ImagePlus;

  return (
    <Card className="sticky top-16 z-30 mb-4">
      <CardContent className="px-4 py-2.5">
        <div className="flex items-center justify-between gap-4">
          {/* Zone 1 — Status */}
          <div className="text-muted-foreground flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1.5">
              <Users className="text-muted-foreground h-3.5 w-3.5" />
              <span className="text-foreground font-medium tabular-nums">
                {assignedGuests}/{totalGuests}
              </span>
              <span className="hidden sm:inline">placed</span>
            </span>
            <span className="bg-border h-4 w-px" />
            <span className="flex items-center gap-1.5">
              <TableIcon className="text-muted-foreground h-3.5 w-3.5" />
              <span className="text-foreground font-medium tabular-nums">{totalTables}</span>
              <span className="hidden sm:inline">tables</span>
            </span>
            <span className="bg-border hidden h-4 w-px md:block" />
            <button
              type="button"
              onClick={() => navigate('/room-setup')}
              className="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-primary hidden items-center gap-1.5 rounded-md px-2 py-1 transition-colors focus-visible:ring-2 focus-visible:outline-hidden md:flex"
            >
              <SetupIcon className="h-3.5 w-3.5" />
              <span className="font-medium">{setupLabel}</span>
            </button>
          </div>

          {/* Zone 2 — View toggles (segmented) */}
          <div
            className="border-border bg-muted hidden items-center gap-1 rounded-lg border p-1 md:flex"
            role="group"
            aria-label="Canvas view options"
          >
            <SegmentedToggle
              active={pinAllPills}
              onClick={() => setPinAllPills(!pinAllPills)}
              icon={<Tag className="h-3.5 w-3.5" />}
              label="Labels"
              title="Toggle table label overlays for all tables"
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <SegmentedToggle
                    active={showScaleGrid}
                    onClick={() => setShowScaleGrid(!showScaleGrid)}
                    icon={<Grid3X3 className="h-3.5 w-3.5" />}
                    label="Grid"
                  />
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {isReferenceLocked
                  ? 'Toggle 5-foot scale grid overlay'
                  : 'Toggle 5-foot reference grid (lock scale in Room Setup for exact calibration)'}
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Zone 3 — Create */}
          <div className="flex items-center gap-2">
            <AddAssetDropdown />
            <AddTableDropdown variant="primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
