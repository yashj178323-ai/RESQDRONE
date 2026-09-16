import { ChevronDown, ChevronUp, Terminal } from 'lucide-react';
import { useDroneState, useSensorState, useSystemState } from '@/context/AppStore';
import { headingLabel } from '@/utils/format';

/**
 * Bottom instrument bar. One compact strip replaces the telemetry, connection
 * and health cards that used to compete for space in the workspace.
 */
export function MissionStatusBar({
  logOpen,
  onToggleLog,
  eventCount,
}: {
  logOpen: boolean;
  onToggleLog: () => void;
  eventCount: number;
}) {
  const { telemetry } = useDroneState();
  const { connection, health } = useSystemState();
  const { hardware } = useSensorState();

  const sensorsUp = hardware.filter((h) => h.state !== 'OFFLINE').length;
  const linkGood = connection.droneLink === 'CONNECTED';
  const gpsLocked = connection.gps === 'LOCKED';
  const aiUp = health.aiEngine === 'ACTIVE';

  const groups: { label: string; values: [string, string, string?][] }[] = [
    {
      label: 'Flight',
      values: [
        ['ALT', `${telemetry.altitude.toFixed(0)} m`],
        ['SPD', `${telemetry.speed.toFixed(1)} m/s`],
        ['HDG', `${telemetry.heading.toString().padStart(3, '0')}° ${headingLabel(telemetry.heading)}`],
      ],
    },
    {
      label: 'Power',
      values: [
        ['BAT', `${telemetry.battery.toFixed(0)}%`],
        ['FLT', `${Math.floor(telemetry.flightTimeSec / 60)}m`],
      ],
    },
    {
      label: 'Nav',
      values: [
        ['GPS', gpsLocked ? 'LOCK' : 'DEGRADED', gpsLocked ? 'text-ok' : 'text-warn'],
        ['LINK', linkGood ? 'GOOD' : 'LOST', linkGood ? 'text-ok' : 'text-crit'],
      ],
    },
    {
      label: 'Sensors',
      values: [
        ['BUS', `${sensorsUp}/${hardware.length}`, sensorsUp === hardware.length ? 'text-ok' : 'text-warn'],
        ['AI', aiUp ? 'ACTIVE' : 'OFFLINE', aiUp ? 'text-ok' : 'text-warn'],
      ],
    },
  ];

  return (
    <div className="flex h-11 min-w-0 shrink-0 items-center gap-4 rounded-control border border-edge bg-panel2 px-3">
      {groups.map((g, i) => (
        <div
          key={g.label}
          className={`flex min-w-0 items-center gap-2.5 ${
            i >= 2 ? 'hidden lg:flex' : ''
          } ${i === 3 ? 'hidden xl:flex' : ''}`}
        >
          {i > 0 && <span className="h-5 w-px shrink-0 bg-edge" aria-hidden />}
          <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-dim">
            {g.label}
          </span>
          {g.values.map(([k, v, tone]) => (
            <span key={k} className="flex shrink-0 items-baseline gap-1.5 font-mono text-[12px]">
              <span className="text-[10px] text-dim">{k}</span>
              <span className={tone ?? 'text-ink'}>{v}</span>
            </span>
          ))}
        </div>
      ))}

      <button
        type="button"
        onClick={onToggleLog}
        aria-expanded={logOpen}
        className="ml-auto flex shrink-0 items-center gap-2 rounded-control border border-edge px-2.5 py-1.5 text-[11px] text-muted transition-colors ease-ui hover:text-info"
      >
        <Terminal size={13} strokeWidth={1.8} aria-hidden />
        Events
        <span className="font-mono text-[11px] text-ink">{eventCount}</span>
        {logOpen ? <ChevronDown size={13} strokeWidth={1.8} aria-hidden /> : <ChevronUp size={13} strokeWidth={1.8} aria-hidden />}
      </button>
    </div>
  );
}
