import React, { useState, useMemo } from 'react';
import { useSeating } from '@/hooks/useSeating';
import { SetupStepper } from '@/components/room-setup/SetupStepper';
import { StepUploadImage } from '@/components/room-setup/StepUploadImage';
import { StepSetScale } from '@/components/room-setup/StepSetScale';

const RoomSetup = () => {
  const { backgroundImageState, isReferenceLocked } = useSeating();
  const hasImage = backgroundImageState.backgroundImage !== null;

  // Determine initial step on mount (re-entry support)
  const initialStep = useMemo(() => {
    if (hasImage) return 2;
    return 1;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only snapshot; hasImage intentionally excluded so step doesn't reset on image changes
  }, []);

  const [currentStep, setCurrentStep] = useState(initialStep);

  const completedSteps = useMemo(() => {
    const completed: number[] = [];
    if (hasImage) completed.push(1);
    if (isReferenceLocked) completed.push(2);
    return completed;
  }, [hasImage, isReferenceLocked]);

  return (
    <div className="container mx-auto max-w-6xl p-6">
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Room Setup</h1>
          <p className="text-muted-foreground mt-1">
            Configure your venue floor plan and measurement scale
          </p>
        </div>

        <SetupStepper
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={setCurrentStep}
        />

        <div className="min-h-[500px]">
          {currentStep === 1 && <StepUploadImage onNext={() => setCurrentStep(2)} />}
          {currentStep === 2 && <StepSetScale onBack={() => setCurrentStep(1)} />}
        </div>
      </div>
    </div>
  );
};

export default RoomSetup;
