import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { type LucideIcon } from 'lucide-react';

interface NavLinkProps {
  to: string;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
}

export const NavLink = ({ to, label, icon: Icon, isActive }: NavLinkProps) => {
  return (
    <Link
      to={to}
      className={cn(
        'relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors duration-200',
        'hover:text-foreground',
        'focus-visible:ring-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        isActive ? 'text-primary' : 'text-muted-foreground',
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
      {isActive && (
        <span className="bg-primary absolute right-0 bottom-0 left-0 h-0.5 rounded-full" />
      )}
    </Link>
  );
};
