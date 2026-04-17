import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Trash2, Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';

interface TableInfoBlockProps {
  name: string;
  defaultChairs: number;
  maxChairs: number;
  tableSize: string;
}

export const TableInfoBlock = ({
  name,
  defaultChairs,
  maxChairs,
  tableSize,
}: TableInfoBlockProps) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">Name</span>
      <span className="font-medium">{name}</span>
    </div>
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">Capacity</span>
      <span className="font-medium">
        {defaultChairs} default / {maxChairs} max
      </span>
    </div>
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">Size</span>
      <span className="font-medium">{tableSize}</span>
    </div>
  </div>
);

interface OccupancyBarProps {
  currentGuests: number;
  defaultChairs: number;
  maxChairs: number;
}

const occupancyBadgeVariant = (
  currentGuests: number,
  defaultChairs: number,
  maxChairs: number,
): 'destructive' | 'secondary' | 'default' => {
  if (currentGuests >= maxChairs) return 'destructive';
  if (currentGuests > defaultChairs) return 'secondary';
  return 'default';
};

export const OccupancyBar = ({ currentGuests, defaultChairs, maxChairs }: OccupancyBarProps) => {
  const overflow = currentGuests > defaultChairs;
  const widthPct = Math.min((currentGuests / maxChairs) * 100, 100);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm">Occupancy</Label>
        <Badge
          variant={occupancyBadgeVariant(currentGuests, defaultChairs, maxChairs)}
          className="text-xs"
        >
          {currentGuests}/{maxChairs}
        </Badge>
      </div>
      <div className="bg-muted rounded p-2">
        <div className="bg-background h-1.5 w-full rounded-full">
          <div
            className={`h-1.5 rounded-full transition-all ${overflow ? 'bg-warning' : 'bg-primary'}`}
            style={{ width: `${widthPct}%` }}
          />
        </div>
        <div className="text-muted-foreground mt-1 flex justify-between text-xs">
          <span>0</span>
          <span className="text-primary">Default: {defaultChairs}</span>
          <span>Max: {maxChairs}</span>
        </div>
      </div>
    </div>
  );
};

interface PositionsToggleProps {
  showPositions: boolean;
  onToggle: () => void;
}

export const PositionsToggle = ({ showPositions, onToggle }: PositionsToggleProps) => (
  <Button
    variant={showPositions ? 'default' : 'outline'}
    size="sm"
    className="w-full text-xs"
    onClick={onToggle}
  >
    {showPositions ? (
      <>
        <EyeOff className="mr-1.5 h-3 w-3" />
        Hide Guest Positions
      </>
    ) : (
      <>
        <Eye className="mr-1.5 h-3 w-3" />
        Show All Guest Positions
      </>
    )}
  </Button>
);

interface DeleteTableDialogProps {
  tableNumber: string;
  currentName: string;
  currentGuests: number;
  onDelete: () => void;
}

export const DeleteTableDialog = ({
  tableNumber,
  currentName,
  currentGuests,
  onDelete,
}: DeleteTableDialogProps) => (
  <AlertDialog>
    <AlertDialogTrigger asChild>
      <Button variant="destructive" size="sm" className="w-full text-xs">
        <Trash2 className="mr-1 h-3 w-3" />
        Delete Table
      </Button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Delete Table</AlertDialogTitle>
        <AlertDialogDescription>
          Are you sure you want to delete "Table {tableNumber}: {currentName}"?
          {currentGuests > 0 && (
            <> All assigned guests ({currentGuests}) will be moved back to the unassigned list.</>
          )}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export const SuggestionLink = () => (
  <div className="border-t pt-2">
    <p className="text-muted-foreground text-xs leading-relaxed">
      Looking for a different way to manage assignments? Check out the{' '}
      <Link to="/table-view" className="text-primary font-medium hover:underline">
        Seat Assignments
      </Link>{' '}
      page.
    </p>
  </div>
);
