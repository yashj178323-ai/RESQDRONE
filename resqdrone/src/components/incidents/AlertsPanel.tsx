import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Panel } from '@/components/ui/Panel';
import { EmptyState } from '@/components/ui/EmptyState';
import { useSystemState } from '@/context/AppStore';
import { formatTime } from '@/utils/format';
import type { AlertLevel } from '@/types';

const META: Record<AlertLevel, { icon: typeof Info; text: string; rail: string; label: string }> = {
  CRITICAL: { icon: CircleAlert, text: 'text-crit', rail: 'border-l-crit', label: 'Critical' },
  WARNING: { icon: TriangleAlert, text: 'text-warn', rail: 'border-l-warn', label: 'Warning' },
  SUCCESS: { icon: CircleCheck, text: 'text-ok', rail: 'border-l-ok', label: 'Confirmed' },
  INFO: { icon: Info, text: 'text-info', rail: 'border-l-info', label: 'Information' },
};

/**
 * Alerts are not equally loud. Critical entries carry a rail, an icon and a
 * heavier title; informational ones stay quiet so they do not compete.
 */
export function AlertsPanel({ limit = 6, className = '' }: { limit?: number; className?: string }) {
  const { alerts } = useSystemState();

  return (
    <Panel
      title="Alerts"
      className={className}
      actions={
        <Link
          to="/detections"
          className="text-[11px] font-medium text-info transition-colors ease-ui hover:underline"
        >
          View all
        </Link>
      }
      bodyClassName="divide-y divide-edge overflow-y-auto"
    >
      {alerts.slice(0, limit).map((a) => {
        const meta = META[a.level];
        const Icon = meta.icon;
        const loud = a.level === 'CRITICAL' || a.level === 'WARNING';
        return (
          <article
            key={a.id}
            className={`flex gap-3 border-l-2 px-3.5 py-3 ${loud ? meta.rail : 'border-l-transparent'}`}
          >
            <Icon size={15} className={`mt-0.5 shrink-0 ${meta.text}`} aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2">
                <span className={`text-[10px] font-semibold uppercase tracking-[0.08em] ${meta.text}`}>
                  {meta.label}
                </span>
                <time className="ml-auto shrink-0 font-mono text-[11px] text-dim">
                  {formatTime(a.at)}
                </time>
              </p>
              <p
                className={`mt-1 truncate ${loud ? 'text-[13px] font-medium text-ink' : 'text-[13px] text-muted'}`}
              >
                {a.title}
              </p>
              {a.detail && <p className="mt-0.5 truncate text-[11px] text-dim">{a.detail}</p>}
            </div>
          </article>
        );
      })}
      {alerts.length === 0 && (
        <EmptyState
          title="No alerts"
          detail="Detections, faults and dispatch events appear here as the mission progresses."
        />
      )}
    </Panel>
  );
}
