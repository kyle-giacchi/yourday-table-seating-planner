import React from 'react';

interface SummaryCardProps {
  title: string;
  value: string;
  subtitle?: string;
}

export const SummaryCard = ({ title, value, subtitle }: SummaryCardProps) => {
  return (
    <div className="bg-muted/50 rounded-lg p-3">
      <div className="flex-1">
        <p className="text-muted-foreground text-xs font-medium">{title}</p>
        <p className="text-foreground text-xl font-bold">{value}</p>
        {subtitle && <p className="text-muted-foreground text-xs">{subtitle}</p>}
      </div>
    </div>
  );
};
