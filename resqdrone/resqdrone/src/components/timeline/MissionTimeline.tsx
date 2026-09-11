import { memo } from 'react';
import { useMissionState } from '@/context/AppStore';
import { formatTime } from '@/utils/format';
import type { MissionEvent } from '@/types';

const SHORT: Partial<Record<MissionEvent['kind'], string>> = {
  MISSION_CREATED: 'Created',
  DRONE_LAUNCHED: 'Launched',
  SEARCH_STARTED: 'Searching',
  DETECTION: 'Detected',
  AWAITING_VERIFICATION: 'Review',
  VERIFIED: 'Verified',
  REJECTED: 'Rejected',
  TEAM_DISPATCHED: 'Dispatched',
  TEAM_ARRIVED: 'On scene',
  MISSION_COMPLETE: 'Rescued',
  FAULT: 'Fault',
  RECOVERY: 'Recovered',
  SYNC: 'Synced',
};

/**
 * The mission's progress as a horizontal rail, sized to sit above the telemetry
 * bar. Only this element may scroll sideways — never the page.
 */
function MissionTimelineBase({ className = '' }: { className?: string }) {
  const { timeline } = useMissionState();
  const events = timeline.slice(-8);
  const activeIndex = events.findIndex((e) => e.state === 'ACTIVE' || e.state === 'PENDING');

  const dot = (e: MissionEvent, isActive: boolean) => {
    if (e.state === 'FAILED') return 'border-crit bg-crit';
    if (e.state === 'DONE') return 'border-ok bg-ok';
    if (isActive) return 'border-warn bg-warn';
    return 'border-edge2 bg-panel';
  };

  return (
    <section
      aria-label="Mission timeline"
      className={`flex h-[86px] min-w-0 shrink-0 items-center gap-3 rounded-control border border-edge bg-panel2 px-3 ${className}`}
    >
      <p className="shrink-0 -rotate-0 text-[10px] font-semibold uppercase leading-tight tracking-[0.1em] text-dim">
        Mission
        <br />
        progress
      </p>
      <span className="h-10 w-px shrink-0 bg-edge" aria-hidden />

      <ol className="flex min-w-0 flex-1 items-start gap-0 overflow-x-auto pb-1">
        {events.map((e, i) => {
          const isActive = i === activeIndex && e.state !== 'DONE';
          const future = e.state === 'PENDING' && !isActive;
          return (
            <li key={e.id} className="flex shrink-0 items-start">
              <div className="flex w-[104px] flex-col items-center text-center">
                <span
                  className={`h-2.5 w-2.5 rounded-full border-2 ${dot(e, isActive)} ${
                    isActive ? 'ring-4 ring-warn/20' : ''
                  }`}
                  aria-hidden
                />
                <span
                  className={`mt-1.5 truncate text-[11px] leading-tight ${
                    isActive ? 'font-semibold text-ink' : future ? 'text-dim' : 'text-muted'
                  }`}
                >
                  {SHORT[e.kind] ?? e.label}
                </span>
                <span className="font-mono text-[10px] text-dim">{formatTime(e.at)}</span>
              </div>
              {i < events.length - 1 && (
                <span
                  className={`mt-[5px] h-px w-4 shrink-0 ${
                    events[i + 1].state === 'DONE' ? 'bg-ok/60' : 'bg-edge2'
                  }`}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export const MissionTimeline = memo(MissionTimelineBase);
