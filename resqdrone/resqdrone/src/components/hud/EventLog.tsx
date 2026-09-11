import { memo, useEffect, useRef } from 'react';
import type { SensorEvent } from '@/types';
import { formatTimeSeconds } from '@/utils/format';

const LEVEL: Record<SensorEvent['level'], string> = {
  OK: 'text-ok',
  INFO: 'text-info',
  WARN: 'text-warn',
  CRITICAL: 'text-crit',
};

/** Terminal-style operational log, newest at the bottom, auto-scrolled. */
function EventLogBase({ events, className = '' }: { events: SensorEvent[]; className?: string }) {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' });
  }, [events.length]);

  return (
    <section
      className={`flex min-h-0 flex-col rounded-panel border border-edge bg-panel ${className}`}
      aria-label="Event log"
    >
      <header className="flex items-center justify-between border-b border-edge px-3.5 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-dim">Event log</p>
        <span className="font-mono text-[10px] text-dim">{events.length} entries</span>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-3.5 py-2" role="log" aria-live="polite">
        {events.length === 0 ? (
          <p className="py-4 text-center text-[11px] text-dim">No events recorded.</p>
        ) : (
          <ul className="space-y-1">
            {events.map((e) => (
              <li key={e.id} className="flex gap-3 font-mono text-[11px] leading-relaxed">
                <span className="shrink-0 text-dim">{formatTimeSeconds(e.at)}</span>
                <span className={`w-[74px] shrink-0 ${LEVEL[e.level]}`}>{e.source}</span>
                <span className="min-w-0 flex-1 text-muted">{e.message}</span>
              </li>
            ))}
          </ul>
        )}
        <div ref={endRef} />
      </div>
    </section>
  );
}

export const EventLog = memo(EventLogBase);
