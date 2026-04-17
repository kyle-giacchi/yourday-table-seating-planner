import React from 'react';
import { Toggle } from '@/components/ui/toggle';
import { Users, User, LayoutGrid } from 'lucide-react';

export type TableDisplayMode = 'party' | 'guest' | 'visual';

interface DisplayModeToggleProps {
  mode: TableDisplayMode;
  onModeChange: (mode: TableDisplayMode) => void;
  className?: string;
}

export const DisplayModeToggle = ({
  mode,
  onModeChange,
  className = '',
}: DisplayModeToggleProps) => {
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
        By Party
      </Toggle>
      <Toggle
        pressed={mode === 'guest'}
        onPressedChange={() => onModeChange('guest')}
        variant="primary-custom"
        size="sm"
        className="h-7 px-2 text-xs"
      >
        <User className="mr-1 h-3 w-3" />
        By Guest
      </Toggle>
      <Toggle
        pressed={mode === 'visual'}
        onPressedChange={() => onModeChange('visual')}
        variant="primary-custom"
        size="sm"
        className="h-7 px-2 text-xs"
      >
        <LayoutGrid className="mr-1 h-3 w-3" />
        Table View
      </Toggle>
    </div>
  );
};
