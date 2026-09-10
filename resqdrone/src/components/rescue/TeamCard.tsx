import { MapPin, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useMissionActions } from '@/hooks/useMissionActions';
import { formatClockDuration, teamStateMeta } from '@/utils/format';
import type { RescueTeam } from '@/types';

const DOT: Record<RescueTeam['state'], string> = {
  AVAILABLE: 'bg-ok',
  STANDBY: 'bg-info',
  DISPATCHED: 'bg-action',
  ON_WAY: 'bg-action',
  ARRIVED: 'bg-ok',
  UNAVAILABLE: 'bg-dim',
};

/** Operational readiness at a glance: who they are, then whether they can go. */
export function TeamCard({ team, dispatchTarget }: { team: RescueTeam; dispatchTarget?: string }) {
  const { focusOn, dispatchTeam } = useMissionActions();
  const meta = teamStateMeta[team.state];
  const enRoute = team.state === 'DISPATCHED' || team.state === 'ON_WAY';
  const deployable = team.state === 'AVAILABLE' || team.state === 'STANDBY';

  return (
    <article
      className={`rounded-panel border bg-panel p-4 ${enRoute ? 'border-action/45' : 'border-edge'}`}
    >
      <header className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold leading-none text-ink">{team.name}</h3>
          <p className="mt-2 flex items-center gap-1.5 text-[12px] font-medium">
            <span className={`h-2 w-2 rounded-full ${DOT[team.state]}`} aria-hidden />
            <span className={meta.text}>{meta.label}</span>
          </p>
        </div>
        {enRoute && (
          <div className="text-right">
            <p className="label">ETA</p>
            <p className="metric mt-1.5 text-action">{formatClockDuration(team.etaSec)}</p>
          </div>
        )}
      </header>

      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-edge pt-3">
        <div>
          <p className="label">Distance</p>
          <p className="metric mt-1.5">{team.distanceKm.toFixed(1)} km</p>
        </div>
        <div>
          <p className="label">Responders</p>
          <p className="metric mt-1.5">{team.members}</p>
        </div>
        <div>
          <p className="label">Assignment</p>
          <p className="mt-1.5 font-mono text-[13px] text-ink">{team.assignmentId ?? '—'}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {team.capability.map((c) => (
          <span
            key={c}
            className="rounded border border-edge bg-panel2 px-2 py-0.5 text-[11px] text-muted"
          >
            {c}
          </span>
        ))}
      </div>

      <p className="mt-3 font-mono text-[11px] text-dim">
        {team.latitude.toFixed(4)}° N, {team.longitude.toFixed(4)}° E
      </p>

      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          icon={<MapPin size={11} />}
          onClick={() => focusOn(team.latitude, team.longitude)}
        >
          Show on map
        </Button>
        {dispatchTarget && (
          <Button
            size="sm"
            variant={deployable ? 'primary' : 'ghost'}
            icon={<Send size={11} />}
            disabled={!deployable}
            onClick={() => dispatchTeam(team.id, dispatchTarget)}
          >
            Dispatch
          </Button>
        )}
      </div>
    </article>
  );
}
