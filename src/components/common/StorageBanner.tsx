import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { detectStorageStatus } from '@/lib/safeStorage';

const DISMISS_KEY = '__storage_banner_dismissed_v1__';

const readDismissed = (): boolean => {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    // If sessionStorage is also blocked, show the banner every time.
    return false;
  }
};

/**
 * One-time banner that warns the user when localStorage is unavailable or
 * blocked. Without it, the user's changes appear to save but evaporate on
 * reload. Dismissing the banner is session-only; next reload re-probes.
 */
export const StorageBanner = () => {
  const [status] = useState(detectStorageStatus);
  const [dismissed, setDismissed] = useState(readDismissed);

  if (status === 'available' || dismissed) return null;

  const onDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // Ignore — user will see it again on next page.
    }
  };

  const message =
    status === 'unavailable'
      ? "This browser doesn't give us access to local storage, so your changes won't be saved between sessions. Export a backup before closing the tab."
      : "Browser storage is blocked or full. Your changes won't be saved between sessions. Disable private mode, allow cookies for this site, or export a backup before closing.";

  return (
    <div className="bg-warning/15 border-warning/40 text-warning-foreground relative border-b px-4 py-2 text-sm">
      <div className="mx-auto flex max-w-5xl items-start gap-2 pr-8">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>{message}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss storage warning"
        className="hover:bg-warning/20 absolute top-1.5 right-2 rounded p-1"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};
