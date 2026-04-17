import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface CapacityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  tableName: string;
  currentCount: number;
  newCount: number;
  defaultCapacity: number;
  maxCapacity: number;
}

export const CapacityModal = ({
  isOpen,
  onClose,
  onConfirm,
  tableName,
  currentCount,
  newCount,
  defaultCapacity,
  maxCapacity,
}: CapacityModalProps) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="w-full max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Exceed Recommended Seating?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              <strong>{tableName}</strong> has a recommended capacity of {defaultCapacity} seats,
              but this assignment would seat {newCount} guests.
            </p>
            <p className="text-muted-foreground text-sm">
              Current: {currentCount} → New: {newCount} (Max possible: {maxCapacity})
            </p>
            <p>Do you want to exceed the recommended seats for this table size?</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col-reverse gap-2">
          <AlertDialogCancel onClick={handleCancel} className="text-center whitespace-normal">
            No, on second thought let's give them some space
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} className="text-center whitespace-normal">
            Yes, let my guests rub shoulders!
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
