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

interface SplitPartyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  splitPartyName: string;
  movingPartyName: string;
}

export const SplitPartyModal = ({
  isOpen,
  onClose,
  onConfirm,
  splitPartyName,
  movingPartyName,
}: SplitPartyModalProps) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const isSameParty = splitPartyName === movingPartyName;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="w-full max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Splitting up the {splitPartyName}?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              {isSameParty ? (
                <>
                  Heads up — sliding someone in here would break the{' '}
                  <strong>{splitPartyName}</strong> group apart.
                </>
              ) : (
                <>
                  Putting the <strong>{movingPartyName}</strong> block right here would wedge
                  between two members of the <strong>{splitPartyName}</strong> party. Couples
                  counseling is extra.
                </>
              )}
            </p>
            <p className="text-muted-foreground text-sm">
              Do you want to separate them? (You can always drag them back.)
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col-reverse gap-2">
          <AlertDialogCancel onClick={onClose} className="text-center whitespace-normal">
            No, keep the {splitPartyName} together
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} className="text-center whitespace-normal">
            Yes, I'm the seating chart villain
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
