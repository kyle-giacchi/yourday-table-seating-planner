import React, { useState } from 'react';
import { Hand, X } from 'lucide-react';
import { COACHMARK_DRAG_ASSIGN_KEY } from '@/lib/storageKeys';
import { safeLocalStorage } from '@/lib/safeStorage';

interface Props {
  visible: boolean;
}

export const CoachMarkBanner = ({ visible }: Props) => {
  const [dismissed, setDismissed] = useState(
    () => safeLocalStorage.getItem(COACHMARK_DRAG_ASSIGN_KEY) === 'true',
  );

  if (dismissed || !visible) return null;

  const handleDismiss = () => {
    safeLocalStorage.setItem(COACHMARK_DRAG_ASSIGN_KEY, 'true');
    setDismissed(true);
  };

  return (
    <div className="bg-primary/5 border-primary/20 mb-4 flex items-start gap-3 rounded-lg border px-4 py-3">
      <div className="bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
        <Hand className="h-4 w-4" />
      </div>
      <div className="text-foreground flex-1 text-sm">
        <p className="text-foreground font-semibold">Drag guests onto a table to seat them</p>
        <p className="text-muted-foreground mt-0.5 text-xs">
          Grab any guest or party from the panel on the right, then drop it on a table in the
          canvas. Tables glow when you hover — that means it&apos;s a valid drop zone.
        </p>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss tip"
        className="text-muted-foreground/70 hover:text-foreground transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
