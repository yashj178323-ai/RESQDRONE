import { Info } from 'lucide-react';
import { useSystemState } from '@/context/AppStore';
import type { SensorReadiness } from '@/types';

function SensorRow({
  label,
  state,
  showTip,
}: {
  label: string;
  state: SensorReadiness | 'LOCKED' | 'DEGRADED' | 'NO_FIX';
  showTip?: boolean;
}) {
  const ok = state === 'ACTIVE' || state === 'LOCKED' || state === 'READY';
  const dot = ok ? 'bg-ok' : state === 'DEGRADED' ? 'bg-warn' : 'bg-crit';
  const text = ok ? 'text-ok' : state === 'DEGRADED' ? 'text-warn' : 'text-crit';
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-[11px] text-muted">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} aria-hidden />
        {label}
        {showTip && (
          <button
            type="button"
            title="GPS-denied navigation uses optical flow and range sensing to estimate local motion when GPS positioning is unavailable. Global coordinates may not be available without an external positioning reference."
            className="text-dim hover:text-muted"
            aria-label="GPS-denied navigation info"
          >
            <Info size={11} strokeWidth={1.8} aria-hidden />
          </button>
        )}
      </span>
      <span className={`font-mono text-[11px] ${text}`}>{state.replace(/_/g, '-')}</span>
    </div>
  );
}

export function NavModeCard({ compact = false }: { compact?: boolean }) {
  const { connection } = useSystemState();
  const denied = connection.navMode === 'GPS_DENIED';

  if (compact) {
    return (
      <div
        className={`flex items-center gap-2 rounded-control border px-2.5 py-1.5 text-[11px] ${
          denied ? 'border-warn/50 bg-warn/10 text-warn' : 'border-edge bg-panel2 text-muted'
        }`}
        title="Navigation mode"
      >
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${denied ? 'bg-warn' : 'bg-ok'}`} aria-hidden />
        <span className="font-semibold uppercase tracking-[0.08em]">
          {denied ? 'GPS-DENIED' : 'GPS NAV'}
        </span>
      </div>
    );
  }

  return (
    <section className="rounded-panel border border-edge bg-panel p-3.5" aria-label="Navigation mode">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink">Navigation</h3>
        <span className={`rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase ${
          denied ? 'border-warn/50 bg-warn/10 text-warn' : 'border-ok/40 bg-ok/10 text-ok'
        }`}>
          {denied ? 'GPS-DENIED' : 'GPS'}
        </span>
      </div>
      <div className="mt-3 space-y-2">
        <SensorRow label="GPS" state={connection.gps} />
        <SensorRow label="Optical flow" state={connection.opticalFlow} showTip />
        <SensorRow label="Range / LiDAR" state={connection.rangeSensor} />
      </div>
      {denied && (
        <p className="mt-3 rounded-control border border-warn/40 bg-warn/10 px-2.5 py-2 text-[11px] leading-relaxed text-warn">
          GPS unavailable — local navigation supported using optical flow and range sensing.
        </p>
      )}
      <p className="mt-2.5 text-[10px] leading-relaxed text-dim">
        {denied
          ? 'Local motion estimation active. Global coordinates may not be available.'
          : 'Global positioning active. Optical flow available as fallback.'}
      </p>
    </section>
  );
}
