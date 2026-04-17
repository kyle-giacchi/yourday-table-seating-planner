import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SetupStepperProps {
  currentStep: number;
  completedSteps: number[];
  onStepClick: (step: number) => void;
}

const STEP_LABELS: Record<number, string> = {
  1: 'Upload floor plan',
  2: 'Set scale',
};

const TOTAL_STEPS = 2;

export const SetupStepper = ({ currentStep, completedSteps, onStepClick }: SetupStepperProps) => {
  const previousCompleted = currentStep > 1 && completedSteps.includes(currentStep - 1);
  const label = STEP_LABELS[currentStep] ?? '';

  return (
    <div className="flex items-center justify-center gap-3 text-sm">
      <span className="bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium">
        {completedSteps.includes(currentStep) ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <span className="border-primary/40 inline-flex h-4 w-4 items-center justify-center rounded-full border text-[10px]">
            {currentStep}
          </span>
        )}
        Step {currentStep} of {TOTAL_STEPS}
      </span>
      <span className="text-foreground font-medium">{label}</span>
      {previousCompleted && (
        <button
          type="button"
          onClick={() => onStepClick(currentStep - 1)}
          className={cn(
            'text-muted-foreground hover:text-foreground ml-2 text-xs underline-offset-2 hover:underline',
          )}
        >
          ← Back to step {currentStep - 1}
        </button>
      )}
    </div>
  );
};
