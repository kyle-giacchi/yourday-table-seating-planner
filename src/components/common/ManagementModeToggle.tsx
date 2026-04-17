import React from 'react';
import { Users, Cog } from 'lucide-react';

interface ManagementModeToggleProps {
  mode: 'assignment' | 'table-editor';
  onModeChange: (mode: 'assignment' | 'table-editor') => void;
  className?: string;
}

export const ManagementModeToggle = ({
  mode,
  onModeChange,
  className = '',
}: ManagementModeToggleProps) => {
  return (
    <div
      className={`border-border bg-muted grid grid-cols-2 gap-1 rounded-lg border p-1 ${className}`}
      role="group"
      aria-label="Panel mode"
    >
      <button
        aria-pressed={mode === 'assignment'}
        onClick={() => onModeChange('assignment')}
        className={`focus-visible:ring-primary flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-all duration-150 focus-visible:ring-2 focus-visible:outline-hidden ${
          mode === 'assignment'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Users className="h-3.5 w-3.5" />
        Assign Guests
      </button>
      <button
        aria-pressed={mode === 'table-editor'}
        onClick={() => onModeChange('table-editor')}
        className={`focus-visible:ring-primary flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-all duration-150 focus-visible:ring-2 focus-visible:outline-hidden ${
          mode === 'table-editor'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Cog className="h-3.5 w-3.5" />
        Tables
      </button>
    </div>
  );
};
