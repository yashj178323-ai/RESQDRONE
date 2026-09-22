import { memo } from 'react';
import type { HardwareLink, HardwareState } from '@/types';

const DOT: Record<HardwareState, string> = {
  CONNECTED: 'bg-ok',
  ACTIVE: 'bg-ok',
  STREAMING: 'bg-ok',
  LOCK: 'bg-ok',
  DEGRADED: 'bg-warn',
  OFFLINE: 'bg-dim',
};

const TEXT: Record<HardwareState, string> = {
  CONNECTED: 'text-ok',
  ACTIVE: 'text-ok',
  STREAMING: 'text-ok',
  LOCK: 'text-ok',
  DEGRADED: 'text-warn',
  OFFLINE: 'text-dim',
};

/**
 * One compact strip for the whole rig. Each entry states plainly whether the
 * reading is live or simulated, so no board is implied to be attached.
 */
function HardwareBarBase({ links }: { links: HardwareLink[] }) {
  return (
    <div className="flex flex-wrap items-stretch gap-px overflow-hidden rounded-panel border border-edge bg-edge">
      {links.map((h) => (
        <div
          key={h.key}
          className="flex min-w-0 flex-[1_1_150px] items-center gap-3 bg-panel px-3 py-2.5"
        >
          <span className={`h-2 w-2 shrink-0 rounded-full ${DOT[h.state]}`} aria-hidden />
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[12px] font-medium text-ink">
              {h.name}
              <span className={`font-mono text-[10px] uppercase tracking-wide ${TEXT[h.state]}`}>
                {h.state}
              </span>
            </p>
            <p className="truncate font-mono text-[10px] text-dim">
              {h.detail} · {h.live ? 'live' : 'simulated'}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export const HardwareBar = memo(HardwareBarBase);
