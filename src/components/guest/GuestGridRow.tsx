import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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
import type { Guest } from '@/types/seating';
import { useSeating } from '@/hooks/useSeating';
import { useToast } from '@/hooks/use-toast';
import { Edit, Trash2, MapPin } from 'lucide-react';

interface GuestGridRowProps {
  guest: Guest;
  onEdit: (guest: Guest) => void;
}

export const GuestGridRow = ({ guest, onEdit }: GuestGridRowProps) => {
  const { removeGuest, seatingData } = useSeating();
  const { toast } = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Find which table the guest is assigned to
  const assignedTable = seatingData.tables.find((table) =>
    table.guests.some((g) => g.id === guest.id),
  );

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    removeGuest(guest.id);
    toast({
      title: 'Success',
      description: 'Guest deleted successfully',
    });
    setShowDeleteConfirm(false);
  };

  const getFirstName = () => guest.firstName || guest.fullName.split(' ')[0] || '';
  const getLastName = () => guest.lastName || guest.fullName.split(' ').slice(1).join(' ') || '';

  return (
    <TableRow className="table-row-enhanced group">
      <TableCell className="text-foreground font-semibold">{getFirstName()}</TableCell>
      <TableCell className="text-foreground font-semibold">{getLastName()}</TableCell>
      <TableCell>
        <span className="text-muted-foreground text-sm font-medium">{guest.party}</span>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="bg-muted/50 border-muted-foreground/20 font-medium">
          {guest.mealSelection}
        </Badge>
      </TableCell>
      <TableCell>
        {assignedTable ? (
          <div className="flex items-center gap-2">
            <MapPin className="text-success h-3 w-3" />
            <Badge variant="default" className="bg-success text-success-foreground shadow-xs">
              {assignedTable.name}
            </Badge>
          </div>
        ) : (
          <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">
            Unassigned
          </Badge>
        )}
      </TableCell>
      <TableCell>
        <div className="flex gap-2 opacity-70 transition-opacity duration-200 group-hover:opacity-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(guest)}
            aria-label={`Edit ${guest.fullName}`}
            className="hover:bg-primary/10 hover:text-primary focus-enhanced h-8 w-8 p-0"
          >
            <Edit className="h-3 w-3" aria-hidden="true" />
          </Button>
          <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                aria-label={`Delete ${guest.fullName}`}
                className="hover:bg-destructive/10 hover:text-destructive focus-enhanced h-8 w-8 p-0"
              >
                <Trash2 className="h-3 w-3" aria-hidden="true" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Guest</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete {guest.fullName}? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
    </TableRow>
  );
};
