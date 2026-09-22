import type { ReactNode } from 'react';

interface MetricProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  tone?: string;
  sub?: string;
}

export function Metric({ label, value, icon, tone = 'text-ink', sub }: MetricProps) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="flex items-center gap-2 text-xs text-muted">
        {icon}
        {label}
      </span>
      <span className="text-right">
        <span className={`font-mono text-sm font-medium ${tone}`}>{value}</span>
        {sub && <span className="ml-1 text-2xs text-dim">{sub}</span>}
      </span>
    </div>
  );
}
