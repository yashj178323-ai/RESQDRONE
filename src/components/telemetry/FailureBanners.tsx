import { useEffect, useRef, useState } from 'react';
import { ChevronDown, TriangleAlert } from 'lucide-react';
import { useDroneState, useSystemState } from '@/context/AppStore';
import { formatTimeSeconds } from '@/utils/format';
import { BATTERY_CRITICAL_PCT, BATTERY_WARN_PCT } from '@/config/constants';

type Tone = 'crit' | 'warn' | 'info';

interface Notice {
  id: string;
  tone: Tone;
  title: string;
  detail: string;
}

const RANK: Record<Tone, number> = { crit: 0, warn: 1, info: 2 };

const TONE: Record<Tone, { wrap: string; text: string }> = {
  crit: { wrap: 'border-crit/50 bg-crit/10', text: 'text-crit' },
  warn: { wrap: 'border-warn/50 bg-warn/10', text: 'text-warn' },
  info: { wrap: 'border-info/45 bg-info/10', text: 'text-info' },
};

/**
 * One notice line, never a scrolling row of banners. The highest-priority
 * condition stays visible; the rest collapse behind a count so the workspace
 * keeps its height and the page never scrolls sideways.
 */
export function FailureBanners({ className = '' }: { className?: string }) {
  const { telemetry } = useDroneState();
  const { connection, health } = useSystemState();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const notices: Notice[] = [];

  if (connection.droneLink === 'LOST') {
    notices.push({
      id: 'link',
      tone: 'crit',
      title: 'Drone link lost',
      detail: `Last telemetry ${formatTimeSeconds(connection.lastTelemetryAt)} · last known position held`,
    });
  }
  if (telemetry.battery <= BATTERY_WARN_PCT) {
    notices.push({
      id: 'battery',
      tone: telemetry.battery <= BATTERY_CRITICAL_PCT ? 'crit' : 'warn',
      title: 'Low battery',
      detail: 'Return-to-home recommended',
    });
  }
  if (connection.gps !== 'LOCKED') {
    notices.push({
      id: 'gps',
      tone: 'warn',
      title: connection.gps === 'NO_FIX' ? 'GPS fix lost' : 'GPS degraded',
      detail: `${telemetry.satellites} satellites · coverage estimate approximate`,
    });
  }
  if (health.aiEngine === 'OFFLINE') {
    notices.push({
      id: 'ai',
      tone: 'warn',
      title: 'AI engine offline',
      detail: 'Manual monitoring of the feed remains available',
    });
  }
  if (health.thermalCamera === 'OFFLINE') {
    notices.push({
      id: 'thermal',
      tone: 'warn',
      title: 'Thermal sensor offline',
      detail: 'RGB detection remains available',
    });
  }
  if (connection.cloud === 'OFFLINE') {
    notices.push({
      id: 'cloud',
      tone: 'info',
      title: 'Local mode',
      detail:
        'Cloud sync is down — drone control, GPS, AI detection and telemetry continue to work locally',
    });
  }
  if (connection.telemetryLink !== 'CONNECTED') {
    notices.push({
      id: 'sim',
      tone: 'info',
      title: 'Simulated telemetry',
      detail: 'No flight-control backend attached · all readings generated locally',
    });
  }

  if (notices.length === 0) return null;

  notices.sort((a, b) => RANK[a.tone] - RANK[b.tone]);
  const [lead, ...rest] = notices;
  const tone = TONE[lead.tone];

  return (
    <div ref={ref} className={`relative min-w-0 ${className}`}>
      <div
        role="status"
        aria-live="polite"
        className={`flex h-9 min-w-0 items-center gap-2.5 rounded-control border px-3 ${tone.wrap}`}
      >
        <TriangleAlert size={13} className={`shrink-0 ${tone.text}`} aria-hidden />
        <span className={`shrink-0 text-[12px] font-semibold ${tone.text}`}>{lead.title}</span>
        <span className="min-w-0 flex-1 truncate text-[12px] text-muted">{lead.detail}</span>
        {rest.length > 0 && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="flex shrink-0 items-center gap-1 rounded border border-edge2 px-2 py-0.5 text-[11px] text-muted transition-colors ease-ui hover:text-ink"
          >
            {rest.length} more issue{rest.length === 1 ? '' : 's'}
            <ChevronDown
              size={11}
              aria-hidden
              className={`transition-transform ease-ui ${open ? 'rotate-180' : ''}`}
            />
          </button>
        )}
      </div>

      {open && rest.length > 0 && (
        <div className="absolute left-0 top-11 z-[600] w-[360px] max-w-full rounded-control border border-edge bg-panel p-2 shadow-raised">
          <ul className="space-y-0.5">
            {rest.map((n) => (
              <li key={n.id} className="rounded px-2 py-1.5">
                <p className={`text-[12px] font-medium ${TONE[n.tone].text}`}>{n.title}</p>
                <p className="text-[11px] text-muted">{n.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
