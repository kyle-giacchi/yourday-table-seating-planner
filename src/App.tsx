import React from 'react';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { TopNavbar } from '@/components/navigation/TopNavbar';
import { ThemeChangeEdgeGlow } from '@/components/theme/ThemeChangeEdgeGlow';
import { RouteErrorBoundary } from '@/components/common/RouteErrorBoundary';
import { StorageBanner } from '@/components/common/StorageBanner';
import { AppDataProvider } from '@/contexts/AppDataProvider';
import { ColorThemeProvider } from '@/contexts/ColorThemeProvider';
import { SeatingDataProvider } from '@/contexts/SeatingDataProvider';
import { UndoProvider } from '@/contexts/UndoProvider';
import { UIStateProvider } from '@/contexts/UIStateProvider';
import { RoomProvider } from '@/contexts/RoomProvider';
import { MealOptionsProvider } from '@/contexts/MealOptionsProvider';
import { useFirstRunNotice } from '@/hooks/useFirstRunNotice';

const Index = React.lazy(() => import('./pages/Index'));
const SeatingManager = React.lazy(() => import('./pages/SeatingManager'));
const TableView = React.lazy(() => import('./pages/TableView'));
const GuestManagement = React.lazy(() => import('./pages/GuestManagement'));
const BanquetTeamSummary = React.lazy(() => import('./pages/BanquetTeamSummary'));
const NotFound = React.lazy(() => import('./pages/NotFound'));
const RoomSetup = React.lazy(() => import('./pages/RoomSetup'));

const HIDDEN_NAV_PATHS = ['/'];

const AppLayout = () => {
  const { pathname } = useLocation();
  const showNav = !HIDDEN_NAV_PATHS.includes(pathname);
  useFirstRunNotice(pathname !== '/');

  return (
    <div className="bg-background min-h-screen">
      <Toaster />
      <ThemeChangeEdgeGlow />
      <StorageBanner />
      {showNav && <TopNavbar />}
      <main className={showNav ? 'pt-14' : ''}>
        <RouteErrorBoundary>
          <React.Suspense
            fallback={
              <div className="flex min-h-screen items-center justify-center">
                <div className="text-muted-foreground text-lg">Loading...</div>
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/room-layout" element={<SeatingManager />} />
              <Route path="/seat-assignments" element={<TableView />} />
              <Route path="/table-view" element={<TableView />} /> {/* Legacy redirect */}
              <Route path="/guest-management" element={<GuestManagement />} />
              <Route path="/banquet-summary" element={<BanquetTeamSummary />} />
              {/* Legacy routes for backward compatibility */}
              <Route path="/seating" element={<SeatingManager />} />
              <Route path="/guests" element={<GuestManagement />} />
              <Route path="/room-setup" element={<RoomSetup />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </React.Suspense>
        </RouteErrorBoundary>
      </main>
    </div>
  );
};

const App = () => (
  <TooltipProvider>
    <AppDataProvider>
      <ColorThemeProvider>
        <MealOptionsProvider>
          <SeatingDataProvider>
            <UndoProvider>
              <UIStateProvider>
                <RoomProvider>
                  <BrowserRouter>
                    <AppLayout />
                  </BrowserRouter>
                </RoomProvider>
              </UIStateProvider>
            </UndoProvider>
          </SeatingDataProvider>
        </MealOptionsProvider>
      </ColorThemeProvider>
    </AppDataProvider>
  </TooltipProvider>
);

export default App;
