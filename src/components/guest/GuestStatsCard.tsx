import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { Guest, Table } from '@/types/seating';
import { useNavigate } from 'react-router-dom';
import { useSummaryData } from '@/hooks/useSummaryData';
import { MealOptionsEditor } from './MealOptionsEditor';

interface GuestStatsCardProps {
  guests: Guest[];
  tables: Table[];
}

const PROGRESS_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--accent))',
  'hsl(var(--muted))',
  'hsl(var(--destructive))',
  'hsl(var(--warning))',
];

export const GuestStatsCard = ({ guests, tables }: GuestStatsCardProps) => {
  const summaryData = useSummaryData(guests, tables);
  const [showEditor, setShowEditor] = useState(false);
  const navigate = useNavigate();

  const sortedMeals = Object.entries(summaryData.mealStats)
    .sort(([, a], [, b]) => b - a)
    .map(([meal, count]) => ({
      meal,
      count,
      percentage: summaryData.totalGuests > 0 ? (count / summaryData.totalGuests) * 100 : 0,
    }));

  return (
    <Card className="animate-fade-in-up">
      <CardContent className="px-5 py-4">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Left: metrics */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <div>
                <div className="text-foreground text-2xl font-bold">{summaryData.totalGuests}</div>
                <div className="text-muted-foreground text-xs">Guests</div>
              </div>
              <div>
                <div className="text-foreground text-2xl font-bold">{summaryData.totalParties}</div>
                <div className="text-muted-foreground text-xs">Parties</div>
              </div>
              <div>
                <div className="text-foreground text-2xl font-bold">
                  {summaryData.assignedGuests}
                </div>
                <div className="text-muted-foreground text-xs">Assigned</div>
              </div>
              <div>
                <div
                  className={`text-2xl font-bold ${summaryData.unassignedGuests > 0 ? 'text-warning' : 'text-foreground'}`}
                >
                  {summaryData.unassignedGuests}
                </div>
                <div className="text-muted-foreground text-xs">Unassigned</div>
              </div>
            </div>

            {/* Assignment progress */}
            {summaryData.totalGuests > 0 && (
              <div className="space-y-1">
                <Progress
                  value={summaryData.assignmentPercentage}
                  className="h-1"
                  style={{ '--progress-color': 'hsl(var(--primary))' } as React.CSSProperties}
                />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">
                    {summaryData.assignmentPercentage}% seated
                  </span>
                  {summaryData.unassignedGuests > 0 && (
                    <button
                      onClick={() => navigate('/seating')}
                      className="text-warning hover:text-warning/80 text-xs hover:underline"
                    >
                      Seat them →
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right: meal bars */}
          {sortedMeals.length > 0 ? (
            <div className="space-y-2">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Meals
                </span>
                <button
                  onClick={() => setShowEditor(true)}
                  className="text-muted-foreground hover:text-primary text-xs hover:underline"
                >
                  Edit meals
                </button>
              </div>
              {sortedMeals.map(({ meal, count, percentage }, index) => (
                <div key={meal} className="flex items-center gap-2">
                  <span className="w-24 shrink-0 truncate text-xs font-medium">{meal}</span>
                  <Progress
                    value={percentage}
                    className="h-1.5 flex-1"
                    style={
                      {
                        '--progress-color': PROGRESS_COLORS[index % PROGRESS_COLORS.length],
                      } as React.CSSProperties
                    }
                  />
                  <span className="text-muted-foreground w-6 shrink-0 text-right text-xs tabular-nums">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-end">
              <button
                onClick={() => setShowEditor(true)}
                className="text-muted-foreground hover:text-primary text-xs hover:underline"
              >
                + Add meals
              </button>
            </div>
          )}
        </div>
      </CardContent>

      <MealOptionsEditor open={showEditor} onClose={() => setShowEditor(false)} />
    </Card>
  );
};
