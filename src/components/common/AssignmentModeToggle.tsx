import React from 'react';
import { Toggle } from '@/components/ui/toggle';
import { Users, User } from 'lucide-react';

interface AssignmentModeToggleProps {
  mode: 'party' | 'guest';
  onModeChange: (mode: 'party' | 'guest') => void;
  className?: string;
}

export const AssignmentModeToggle = ({
  mode,
  onModeChange,
  className = '',
}: AssignmentModeToggleProps) => {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Toggle
        pressed={mode === 'party'}
        onPressedChange={() => onModeChange('party')}
        variant="primary-custom"
        size="sm"
        className="h-7 px-2 text-xs"
      >
        <Users className="mr-1 h-3 w-3" />
        Party
      </Toggle>
      <Toggle
        pressed={mode === 'guest'}
        onPressedChange={() => onModeChange('guest')}
        variant="primary-custom"
        size="sm"
        className="h-7 px-2 text-xs"
      >
        <User className="mr-1 h-3 w-3" />
        Guest
      </Toggle>
    </div>
  );
};
