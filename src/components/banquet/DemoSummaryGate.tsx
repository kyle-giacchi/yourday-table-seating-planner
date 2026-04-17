import React from 'react';
import { Lock, ExternalLink, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { safeLocalStorage } from '@/lib/safeStorage';
import { DEMO_SUMMARY_UNLOCKED_KEY } from '@/lib/storageKeys';

interface DemoSummaryGateProps {
  onUnlock: () => void;
}

/**
 * Demo-mode gate for the Banquet Summary page.
 * Shows LinkedIn / BuyMeACoffee links over the blurred mockup.
 * Clicking either link opens it in a new tab and unlocks the real summary.
 */
export const DemoSummaryGate = ({ onUnlock }: DemoSummaryGateProps) => {
  const handleLinkClick = () => {
    safeLocalStorage.setItem(DEMO_SUMMARY_UNLOCKED_KEY, 'true');
    onUnlock();
  };

  return (
    <div className="flex h-screen flex-col">
      <div className="container mx-auto p-4">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Banquet Team Summary</h1>
            <p className="text-sm text-gray-600">
              Complete event overview for banquet and catering management
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden bg-gray-50 px-4">
        <div className="relative mx-auto max-w-7xl">
          {/* Blurred mockup content — all fake data */}
          <div className="pointer-events-none blur-xs select-none" aria-hidden="true">
            <div className="space-y-4">
              {/* Mock Table Summary */}
              <div className="rounded-lg border border-gray-200 bg-white shadow-xs">
                <div className="border-b border-gray-200 p-4">
                  <h2 className="text-lg font-semibold text-gray-900">Table Summary</h2>
                </div>
                <div className="space-y-4 p-4">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs font-medium text-gray-600">Total Tables</p>
                      <p className="text-xl font-bold text-gray-900">12</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs font-medium text-gray-600">Total Chairs</p>
                      <p className="text-xl font-bold text-gray-900">96</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mock Food Summary */}
              <div className="rounded-lg border border-gray-200 bg-white shadow-xs">
                <div className="border-b border-gray-200 p-4">
                  <h2 className="text-lg font-semibold text-gray-900">Food Summary</h2>
                </div>
                <div className="space-y-4 p-4">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs font-medium text-gray-600">Total Guests</p>
                      <p className="text-xl font-bold text-gray-900">96</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs font-medium text-gray-600">Meal Selections</p>
                      <p className="text-xl font-bold text-gray-900">4</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Demo unlock overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="mx-4 w-full max-w-md rounded-2xl border border-gray-200 bg-white/95 p-8 text-center shadow-xl backdrop-blur-xs">
              <div className="bg-primary/10 mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full">
                <Lock className="text-primary h-7 w-7" />
              </div>

              <h2 className="mb-2 text-xl font-bold text-gray-900">Enjoying Your Day?</h2>
              <p className="mb-6 text-sm text-gray-600">
                Connect with the creator to unlock the full banquet summary
              </p>

              <div className="space-y-3">
                <Button asChild size="lg" className="w-full">
                  <a
                    href="https://www.linkedin.com/in/kylegiacchi/"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleLinkClick}
                  >
                    <ExternalLink className="mr-2 h-5 w-5" />
                    Connect on LinkedIn
                  </a>
                </Button>

                <Button asChild variant="outline" size="lg" className="w-full">
                  <a
                    href="https://buymeacoffee.com/kylegiacchi"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleLinkClick}
                  >
                    <Coffee className="mr-2 h-5 w-5" />
                    Buy Me a Coffee
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
