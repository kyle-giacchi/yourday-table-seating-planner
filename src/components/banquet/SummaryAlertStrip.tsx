import React from 'react';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import type { SummaryAlert } from '@/utils/summaryViewModel';

interface Props {
  alerts: SummaryAlert[];
}

const styles = {
  error: {
    container: 'border-destructive/30 bg-destructive/10',
    icon: 'text-destructive',
    title: 'text-destructive',
    detail: 'text-destructive/90',
  },
  warning: {
    container: 'border-warning/30 bg-warning/10',
    icon: 'text-warning',
    title: 'text-warning',
    detail: 'text-warning/90',
  },
} as const;

export const SummaryAlertStrip = ({ alerts }: Props) => {
  if (alerts.length === 0) return null;
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {alerts.map((alert) => {
        const s = styles[alert.severity];
        const Icon = alert.severity === 'error' ? AlertCircle : AlertTriangle;
        return (
          <div
            key={alert.id}
            className={`flex items-start gap-3 rounded-xl border p-4 ${s.container}`}
            role={alert.severity === 'error' ? 'alert' : 'status'}
          >
            <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${s.icon}`} aria-hidden="true" />
            <div className="min-w-0">
              <p className={`text-sm font-semibold ${s.title}`}>{alert.title}</p>
              <p className={`mt-0.5 text-xs ${s.detail}`}>{alert.detail}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
