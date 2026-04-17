import React from 'react';

interface CapacityPillProps {
  occupancy: number;
  recommended: number;
  max: number;
  className?: string;
}

const colorFor = (occupancy: number, recommended: number, max: number) => {
  if (occupancy > max)
    return { text: 'text-destructive', fill: 'bg-destructive/30', border: 'border-destructive/40' };
  if (occupancy > recommended)
    return { text: 'text-warning', fill: 'bg-warning/30', border: 'border-warning/40' };
  return { text: 'text-success', fill: 'bg-success/25', border: 'border-success/40' };
};

export const CapacityPill = ({
  occupancy,
  recommended,
  max,
  className = '',
}: CapacityPillProps) => {
  const hasStretch = max > recommended;
  const fillDenom = Math.max(max, 1);
  const fillPct = Math.min((occupancy / fillDenom) * 100, 100);

  const c = colorFor(occupancy, recommended, max);
  const ariaLabel = hasStretch
    ? `${occupancy} seated, ${recommended} recommended, ${max} max`
    : `${occupancy} of ${recommended} seats filled`;

  return (
    <div
      className={`bg-card relative inline-flex items-center overflow-hidden rounded-full border px-2.5 py-1 text-xs font-semibold ${c.border} ${className}`}
      role="meter"
      aria-valuenow={occupancy}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      <div
        className={`absolute inset-y-0 left-0 transition-all duration-300 ${c.fill}`}
        style={{ width: `${fillPct}%` }}
        aria-hidden="true"
      />
      <span className={`relative tabular-nums ${c.text}`}>
        {occupancy} of {recommended}
        {hasStretch && (
          <>
            <span className="text-muted-foreground/60 mx-1.5">|</span>
            <span className="text-muted-foreground font-medium">Max {max}</span>
          </>
        )}
      </span>
    </div>
  );
};
