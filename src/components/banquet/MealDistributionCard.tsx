import React from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Utensils } from 'lucide-react';
import type { BanquetSummaryData } from '@/types/banquet';
import { mealHex } from './mealColors';

interface Props {
  foodSummary: BanquetSummaryData['foodSummary'];
  totalGuests: number;
}

interface TooltipPayload {
  name?: string;
  value?: number;
  payload?: { mealType: string; count: number; percentage: number };
}

const ChartTooltip = ({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) => {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0]?.payload;
  if (!item) return null;
  return (
    <div className="border-border bg-popover rounded-md border px-3 py-2 text-xs shadow-md">
      <div className="text-foreground font-semibold">{item.mealType}</div>
      <div className="text-muted-foreground">
        {item.count} guests · {item.percentage}%
      </div>
    </div>
  );
};

export const MealDistributionCard = ({ foodSummary, totalGuests }: Props) => {
  const data = foodSummary.filter((f) => f.count > 0);
  const hasData = data.length > 0 && totalGuests > 0;

  return (
    <section
      aria-labelledby="meal-distribution-heading"
      className="border-border bg-card rounded-xl border p-6 shadow-xs"
    >
      <header className="mb-4 flex items-center gap-2">
        <Utensils className="text-muted-foreground h-4 w-4" aria-hidden="true" />
        <h2 id="meal-distribution-heading" className="text-foreground text-lg font-semibold">
          Meal Distribution
        </h2>
      </header>

      {!hasData ? (
        <p className="text-muted-foreground py-8 text-center text-sm">No meal selections yet.</p>
      ) : (
        <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-2">
          <div className="relative h-56 w-full min-w-0 print:hidden">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="count"
                  nameKey="mealType"
                  innerRadius={60}
                  outerRadius={88}
                  paddingAngle={2}
                  stroke="#fff"
                  strokeWidth={2}
                  isAnimationActive={false}
                >
                  {data.map((entry) => (
                    <Cell key={entry.mealType} fill={mealHex(entry.mealType)} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-foreground text-2xl font-bold tabular-nums">{totalGuests}</span>
              <span className="text-muted-foreground text-xs">total guests</span>
            </div>
          </div>

          <ul className="space-y-2">
            {data.map((item) => (
              <li
                key={item.mealType}
                className="bg-muted/50 flex items-center justify-between gap-3 rounded-lg px-3 py-2"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: mealHex(item.mealType) }}
                    aria-hidden="true"
                  />
                  <span className="text-foreground truncate text-sm font-medium">
                    {item.mealType}
                  </span>
                </div>
                <div className="flex items-baseline gap-2 tabular-nums">
                  <span className="text-muted-foreground text-xs">{item.percentage}%</span>
                  <span className="text-foreground text-sm font-semibold">{item.count}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};
