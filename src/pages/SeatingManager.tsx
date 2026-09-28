import React, { useRef, useEffect } from 'react';
import { Undo2, Ruler } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { UnifiedAssignmentPanel } from '@/components/common/UnifiedAssignmentPanel';
import { ManagementModeToggle } from '@/components/common/ManagementModeToggle';
import { CanvasToolbar } from '@/components/seating/CanvasToolbar';
import { TableEditor } from '@/components/seating/table-editor/TableEditor';
import { SeatingCanvas } from '@/components/seating';
import { CoachMarkBanner } from '@/components/seating/CoachMarkBanner';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { useColumnHeightSync } from '@/hooks/useColumnHeightSync';
import { useSeating } from '@/hooks/useSeating';
import { useTableAssignment } from '@/hooks/useTableAssignment';
import { startGuestDrag, startPartyDrag } from '@/utils/dragUtils';

const SeatingManager = () => {
  const {
    managementMode,
    setManagementMode,
    resetZoom,
    seatingData,
    backgroundImageState,
    isReferenceLocked,
  } = useSeating();
  const { lastAssignment, undoLastAssignment } = useTableAssignment();
  const { unassignedGuests, tables } = seatingData;
  const navigate = useNavigate();
  const hasImage = !!backgroundImageState?.backgroundImage;
  const scaleNotSet = hasImage && !isReferenceLocked;

  useEffect(() => {
    resetZoom();
  }, [resetZoom]);

  const canvasRef = useRef<HTMLDivElement>(null);
  const rightColumnRef = useRef<HTMLDivElement>(null);
  useColumnHeightSync({ sourceRef: canvasRef, targetRef: rightColumnRef });

  const hasUnassigned = unassignedGuests.length > 0;
  const hasTables = tables.length > 0;

  return (
    <ErrorBoundary>
      <div className="container mx-auto space-y-6 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Room Layout Planner</h1>
          </div>
          {lastAssignment && (
            <Button variant="outline" size="sm" onClick={undoLastAssignment} className="shrink-0">
              <Undo2 className="mr-2 h-4 w-4" />
              Undo last assignment
            </Button>
          )}
        </div>
        {scaleNotSet && (
          <div className="border-warning/30 bg-warning/10 flex items-start justify-between gap-3 rounded-md border px-4 py-3 text-sm">
            <div className="flex items-start gap-2">
              <Ruler className="text-warning mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium">Floor plan scale isn't set yet</p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  Tables won't match real-world proportions until you calibrate the scale.
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate('/room-setup')}>
              Set scale
            </Button>
          </div>
        )}
        <CoachMarkBanner visible={hasUnassigned && hasTables} />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <div ref={canvasRef} className="flex flex-col lg:col-span-3">
            <CanvasToolbar />
            <SeatingCanvas />
          </div>
          <div ref={rightColumnRef} className="flex min-h-0 flex-col overflow-hidden lg:col-span-1">
            <div className="mb-4 shrink-0">
              <ManagementModeToggle mode={managementMode} onModeChange={setManagementMode} />
            </div>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <ErrorBoundary>
                {managementMode === 'assignment' ? (
                  <UnifiedAssignmentPanel
                    mode="guest"
                    onGuestDragStart={startGuestDrag}
                    onPartyDragStart={(e, party) => startPartyDrag(e, party.name, party.size)}
                    showModeToggle={true}
                  />
                ) : (
                  <TableEditor />
                )}
              </ErrorBoundary>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default SeatingManager;
