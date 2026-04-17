import React from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface AssignmentSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  placeholder: string;
  className?: string;
}

export const AssignmentSearch = ({
  searchTerm,
  onSearchChange,
  placeholder,
  className = '',
}: AssignmentSearchProps) => {
  return (
    <div className={`relative ${className}`}>
      <Search
        className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform"
        aria-hidden="true"
      />
      <Input
        type="text"
        placeholder={placeholder}
        aria-label="Search unassigned guests and parties"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-10"
      />
    </div>
  );
};
