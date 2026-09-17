import { useDroneState, useIncidentState, useMissionState, useSystemState } from '@/context/AppStore';
import { isAwaitingReview, missionStatusLabel } from '@/config/status';

interface Item {
  label: string;
  value: string;
  tone?: string;
  dot?: string;
}

/**
 * Situation, not identity. The header already owns the mission name, drone and
 * battery, so this strip answers only: which zone, how far through, anything
 * pending, is navigation trustworthy.
 */
export function MissionStatusStrip() {
  const { missions, activeMissionId, areas, selectedAreaId } = useMissionState();
  const { detections } = useIncidentState();
  const { connection } = useSystemState();
  const { telemetry } = useDroneState();

  const mission = missions.find((m) => m.id === activeMissionId);
  /*
   * Single source of truth: whichever zone is selected. The strip used to pick
   * the first IN_PROGRESS area while the Search Zones panel showed the selected
   * one, so the two disagreed whenever the operator changed zones.
   */
  const zone = areas.find((a) => a.id === selectedAreaId) ?? areas[0];
  const pending = detections.filter((d) => isAwaitingReview(d.verification)).length;
  const linkGood = connection.droneLink === 'CONNECTED' && connection.telemetry === 'CONNECTED';

  const items: Item[] = [
    {
      label: 'Mission',
      value: mission ? missionStatusLabel[mission.status] : 'No mission',
      dot: mission?.status === 'ACTIVE' ? 'bg-ok' : 'bg-dim',
    },
    { label: 'Zone', value: zone ? `${zone.name.replace('Search ', '')} · ${zone.progress}%` : '—' },
    {
      label: 'Targets',
      value: pending === 0 ? 'None awaiting review' : `${pending} awaiting review`,
      tone: pending > 0 ? 'text-crit' : 'text-muted',
    },
    {
      label: 'GPS',
      value:
        connection.gps === 'LOCKED'
          ? `Lock · ${telemetry.satellites} sats`
          : connection.gps === 'DEGRADED'
            ? 'Degraded'
            : 'No fix',
      tone: connection.gps === 'LOCKED' ? 'text-ink' : 'text-warn',
    },
    {
      label: 'Link',
      value: linkGood ? 'Good' : 'Degraded',
      tone: linkGood ? 'text-ink' : 'text-warn',
    },
  ];

  return (
    <div className="flex h-10 min-w-0 items-center gap-4 rounded-control border border-edge bg-panel2 px-3">
      {items.map((i, idx) => (
        <div key={i.label} className="flex min-w-0 items-center gap-2">
          {idx > 0 && <span className="hidden h-4 w-px shrink-0 bg-edge sm:block" aria-hidden />}
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.1em] text-dim">
            {i.label}
          </span>
          <span
            className={`flex min-w-0 items-center gap-1.5 truncate font-mono text-[12px] ${i.tone ?? 'text-ink'}`}
          >
            {i.dot && <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${i.dot}`} aria-hidden />}
            <span className="truncate">{i.value}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
