import { Activity, CloudOff, Radio, ShieldCheck } from 'lucide-react';
import { useDroneState, useSystemState } from '@/context/AppStore';

function ageLabel(ageMs: number) {
  if (!Number.isFinite(ageMs) || ageMs < 0) return '—';
  if (ageMs < 1000) return 'just now';
  if (ageMs < 60_000) return `${Math.floor(ageMs / 1000)}s ago`;
  return `${Math.floor(ageMs / 60_000)}m ago`;
}

export function OperationalStatusBar() {
  const { connection, health, queue } = useSystemState();
  const { telemetry, simulating } = useDroneState();
  const telemetryAge = Date.now() - telemetry.updatedAt;
  const queued = queue.filter((q) => q.status === 'QUEUED').length;
  const degraded = Object.values(health).filter((v) => v === 'DEGRADED' || v === 'OFFLINE').length;
  const source = connection.telemetryLink === 'CONNECTED' ? 'LIVE BACKEND' : simulating ? 'SIMULATION' : 'LOCAL';

  return (
    <div className="flex min-w-0 shrink-0 flex-wrap items-center gap-x-4 gap-y-1 overflow-hidden border-b border-edge bg-panel2 px-3 py-1.5 text-[10px] uppercase tracking-[0.08em] text-dim">
      <span className="flex items-center gap-1.5">
        <Radio size={12} aria-hidden />
        <span>Telemetry {connection.telemetry}</span>
      </span>
      <span className="flex items-center gap-1.5">
        <Activity size={12} aria-hidden />
        <span>Data {ageLabel(telemetryAge)}</span>
      </span>
      <span className="flex items-center gap-1.5">
        {connection.cloud === 'ONLINE' ? <ShieldCheck size={12} aria-hidden /> : <CloudOff size={12} aria-hidden />}
        <span>{connection.cloud === 'ONLINE' ? 'Cloud online' : `${queued} queued locally`}</span>
      </span>
      <span className={degraded ? 'text-warn' : 'text-ok'}>
        {degraded ? `${degraded} subsystem issue${degraded === 1 ? '' : 's'}` : 'System nominal'}
      </span>
      <span className="ml-auto shrink-0 font-mono text-dim">SOURCE: {source}</span>
    </div>
  );
}
