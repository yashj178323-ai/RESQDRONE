import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { CommandMap } from '@/components/map/CommandMap';
import { MissionAreasPanel } from '@/components/mission/MissionAreasPanel';
import { MissionTimeline } from '@/components/timeline/MissionTimeline';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { NavModeCard } from '@/components/navigation/NavModeCard';
import {
  useDroneState,
  useIncidentState,
  useMissionState,
  useRescueState,
} from '@/context/AppStore';
import { formatDuration, humanise } from '@/utils/format';
import { droneStatusLabel } from '@/config/status';

/**
 * Values wrap rather than truncate. "SEARCHING" clipping to "SEARC" made the
 * panel unreadable at 1366px; a min-width plus wrapping fixes it at every
 * breakpoint without shrinking the type.
 */
function Metric({ label, value, tone = 'text-ink' }: { label: string; value: string; tone?: string }) {
  return (
    <div className="min-w-[84px]">
      <p className="label">{label}</p>
      <p className={`mt-1 break-words font-mono text-[15px] font-medium leading-tight ${tone}`}>
        {value}
      </p>
    </div>
  );
}

/**
 * Mission overview, deliberately not a second Live Mission. No payload, no
 * instruments, no verification card — those belong to the operational screen.
 */
export default function CommandCenterPage() {
  const navigate = useNavigate();
  const { missions, activeMissionId, areas } = useMissionState();
  const { detections, survivors } = useIncidentState();
  const { teams, dispatches } = useRescueState();
  const { telemetry } = useDroneState();

  const mission = missions.find((m) => m.id === activeMissionId);

  if (!mission) {
    return (
      <div className="h-full overflow-y-auto p-4">
        <div className="mx-auto max-w-xl rounded-panel border border-edge bg-panel">
          <EmptyState
            title="No active mission"
            detail="Create or select a mission to begin drone operations."
            action={
              <Button variant="primary" onClick={() => navigate('/missions')}>
                Go to missions
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  const missionAreas = areas.filter((a) => a.missionId === mission.id);
  const searched = missionAreas.reduce((t, a) => t + a.areaSearchedKm2, 0);
  const total = missionAreas.reduce((t, a) => t + a.totalAreaKm2, 0);
  const coverage = total === 0 ? 0 : Math.round((searched / total) * 100);
  const pending = detections.filter(
    (d) => d.verification === 'PENDING' || d.verification === 'UNDER_REVIEW',
  ).length;
  const enRoute = teams.filter((t) => t.state === 'DISPATCHED' || t.state === 'ON_WAY').length;

  return (
    <div className="command-centre-page h-full min-h-0 min-w-0 gap-3 overflow-hidden p-3">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-panel border border-edge bg-panel px-4 py-3">
        <div className="min-w-0">
          <p className="eyebrow">Active mission</p>
          <h1 className="mt-1 truncate text-lg font-semibold leading-none text-ink">
            {mission.name}
          </h1>
          <p className="mt-1.5 truncate text-[12px] text-muted">
            {humanise(mission.disaster)} · {mission.location}
          </p>
        </div>
        <div className="grid min-w-0 flex-1 grid-cols-2 gap-x-5 gap-y-3 sm:grid-cols-3 xl:grid-cols-6">
          <Metric label="Coverage" value={`${coverage}%`} />
          <Metric label="Searched" value={`${searched.toFixed(1)} km²`} />
          <Metric label="Detections" value={`${detections.length}`} />
          <Metric label="Pending" value={`${pending}`} tone={pending ? 'text-crit' : 'text-ink'} />
          <Metric label="Survivors" value={`${survivors.length}`} tone="text-ok" />
          <Metric label="Teams out" value={`${enRoute}/${teams.length}`} />
        </div>
        <Button
          size="sm"
          variant="primary"
          icon={<ArrowRight size={12} />}
          onClick={() => navigate('/live-mission')}
        >
          Open live mission
        </Button>
      </header>

      <div className="command-centre-workspace grid min-h-0 min-w-0 grid-cols-1 gap-3 overflow-hidden xl:grid-cols-[minmax(240px,300px)_minmax(0,1fr)_minmax(260px,320px)]">
        <MissionAreasPanel className="command-centre-zone min-h-0 overflow-hidden" onCreate={() => navigate('/missions')} />
        <CommandMap className="h-full min-h-[320px] min-w-0 xl:min-h-0" />

        <div className="command-centre-right flex min-w-0 flex-col gap-3 pr-1">
          <div className="shrink-0 rounded-panel border border-edge bg-panel p-3.5">
            <p className="eyebrow mb-2.5">Drone</p>
            <div className="grid grid-cols-2 gap-3">
              <Metric label="Airframe" value={telemetry.droneId} />
              <Metric label="State" value={droneStatusLabel[telemetry.missionStatus]} />
              <Metric label="Battery" value={`${telemetry.battery.toFixed(0)}%`} />
              <Metric label="Flight" value={formatDuration(telemetry.flightTimeSec)} />
            </div>
          </div>

          <div className="min-h-0 shrink-0 overflow-y-auto">
            <NavModeCard />
          </div>

          <div className="min-h-0 shrink-0 overflow-y-auto rounded-panel border border-edge bg-panel p-3.5">
            <p className="eyebrow mb-2.5">Detections</p>
            <div className="grid grid-cols-2 gap-3">
              <Metric label="Total" value={`${detections.length}`} />
              <Metric
                label="Awaiting review"
                value={`${pending}`}
                tone={pending ? 'text-crit' : 'text-ink'}
              />
              <Metric label="Confirmed" value={`${survivors.length}`} tone="text-ok" />
              <Metric
                label="False"
                value={`${detections.filter((d) => d.verification === 'FALSE_DETECTION').length}`}
                tone="text-dim"
              />
            </div>
          </div>

          <div className="shrink-0 rounded-panel border border-edge bg-panel p-3.5">
            <p className="eyebrow mb-2.5">Rescue</p>
            <div className="grid grid-cols-2 gap-3">
              <Metric label="Dispatched" value={`${dispatches.length}`} />
              <Metric label="On scene" value={`${dispatches.filter((d) => d.arrivedAt).length}`} />
              <Metric label="Teams ready" value={`${teams.filter((t) => t.state === 'AVAILABLE').length}`} />
              <Metric label="En route" value={`${enRoute}`} tone={enRoute ? 'text-action' : 'text-ink'} />
            </div>
          </div>
        </div>
      </div>

      <MissionTimeline />
    </div>
  );
}
