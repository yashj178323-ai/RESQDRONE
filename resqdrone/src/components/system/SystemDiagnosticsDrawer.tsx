import { Drawer } from '@/components/ui/Drawer';
import { useSensorState, useSystemState } from '@/context/AppStore';
import type { SubsystemKey, SubsystemState } from '@/types';

const SUBSYSTEM_LABELS: Record<SubsystemKey, string> = {
  flightController: 'Flight controller',
  gps: 'GPS',
  motors: 'Motors',
  battery: 'Battery',
  rgbCamera: 'RGB camera',
  thermalCamera: 'Thermal camera',
  aiEngine: 'AI engine',
  communication: 'Communication',
};

function tone(state: string): { text: string; dot: string; glyph: string } {
  if (state === 'OFFLINE') return { text: 'text-dim', dot: 'bg-dim', glyph: '○' };
  if (state === 'DEGRADED') return { text: 'text-warn', dot: 'bg-warn', glyph: '⚠' };
  return { text: 'text-ok', dot: 'bg-ok', glyph: '●' };
}

function Row({ name, state, detail }: { name: string; state: string; detail?: string }) {
  const t = tone(state);
  return (
    <div className="flex items-center justify-between gap-3 border-b border-edge py-2.5 last:border-0">
      <div className="min-w-0">
        <p className="text-[13px] text-ink">{name}</p>
        {detail && <p className="truncate font-mono text-[10px] text-dim">{detail}</p>}
      </div>
      <p className={`flex shrink-0 items-center gap-2 font-mono text-[11px] uppercase ${t.text}`}>
        <span aria-hidden>{t.glyph}</span>
        {state}
      </p>
    </div>
  );
}

/** Full system detail, out of the way until an operator asks for it. */
export function SystemDiagnosticsDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { health, connection } = useSystemState();
  const { hardware } = useSensorState();
  const keys = Object.keys(SUBSYSTEM_LABELS) as SubsystemKey[];

  return (
    <Drawer open={open} title="System diagnostics" onClose={onClose}>
      <section>
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-dim">
          Hardware bus
        </p>
        {hardware.map((h) => (
          <Row
            key={h.key}
            name={h.name}
            state={h.state}
            detail={`${h.detail} · ${h.live ? 'live' : 'simulated'}`}
          />
        ))}
      </section>

      <section className="mt-6">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-dim">
          Airframe subsystems
        </p>
        {keys.map((k) => (
          <Row key={k} name={SUBSYSTEM_LABELS[k]} state={health[k] as SubsystemState} />
        ))}
      </section>

      <section className="mt-6">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-dim">Links</p>
        <Row name="Drone link" state={connection.droneLink} />
        <Row name="Telemetry" state={connection.telemetry} />
        <Row name="GPS" state={connection.gps} />
        <Row name="Internet" state={connection.internet} />
        <Row name="Cloud" state={connection.cloud} />
        <Row name="Telemetry source" state={connection.telemetryLink} />
      </section>

      <p className="mt-6 text-[11px] leading-relaxed text-dim">
        Readings marked simulated come from the local simulator. No physical board is attached in
        this build.
      </p>
    </Drawer>
  );
}
