import { FileJson, FileSpreadsheet, Printer } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { Button } from '@/components/ui/Button';
import { Metric } from '@/components/ui/Metric';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  useDroneState,
  useIncidentState,
  useMissionState,
  useRescueState,
} from '@/context/AppStore';
import {
  formatClockDuration,
  formatDate,
  formatDuration,
  formatTime,
  formatTimeSeconds,
  humanise,
} from '@/utils/format';

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toCsv(rows: Record<string, string | number>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  return [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))].join('\n');
}

export default function ReportsPage() {
  const { missions, activeMissionId, areas, timeline } = useMissionState();
  const { detections, survivors } = useIncidentState();
  const { dispatches, teams } = useRescueState();
  const { telemetry } = useDroneState();

  const mission = missions.find((m) => m.id === activeMissionId);
  const missionAreas = areas.filter((a) => a.missionId === mission?.id);
  const confirmed = detections.filter((d) => d.verification === 'CONFIRMED');
  const rejected = detections.filter((d) => d.verification === 'FALSE_DETECTION');
  const avgConfidence =
    detections.length === 0
      ? 0
      : detections.reduce((s, d) => s + d.fusedConfidence, 0) / detections.length;
  const searched = missionAreas.reduce((s, a) => s + a.areaSearchedKm2, 0);
  const responseTime =
    dispatches.length === 0
      ? null
      : dispatches.reduce((s, d) => {
          const det = detections.find((x) => x.id === d.detectionId);
          return s + (det ? (d.dispatchedAt - det.timestamp) / 1000 : 0);
        }, 0) / dispatches.length;

  if (!mission) {
    return (
      <div className="p-4">
        <div className="surface mx-auto max-w-xl">
          <EmptyState
            title="No mission selected"
            detail="Select or create a mission to generate a report."
          />
        </div>
      </div>
    );
  }

  const report = {
    generatedAt: new Date().toISOString(),
    dataSource: 'Local simulator (demonstration)',
    mission: {
      id: mission.id,
      name: mission.name,
      disaster: mission.disaster,
      location: mission.location,
      status: mission.status,
      createdAt: new Date(mission.createdAt).toISOString(),
      searchAreaKm2: mission.areaKm2,
      areaSearchedKm2: Number(searched.toFixed(2)),
      flightTimeSec: telemetry.flightTimeSec,
      distanceKm: telemetry.distanceKm,
      maxAltitudeM: mission.searchAltitude,
      batteryUsedPct: Number((100 - telemetry.battery).toFixed(1)),
    },
    detections: detections.map((d) => ({
      id: d.id,
      priority: d.priority,
      verification: d.verification,
      rgbConfidence: d.rgbConfidence,
      thermalConfidence: d.thermalConfidence,
      fusedConfidence: d.fusedConfidence,
      latitude: d.latitude,
      longitude: d.longitude,
      timestamp: new Date(d.timestamp).toISOString(),
    })),
    survivors: survivors.map((s) => ({
      id: s.id,
      detectionId: s.detectionId,
      latitude: s.latitude,
      longitude: s.longitude,
      status: s.status,
      confirmedAt: new Date(s.confirmedAt).toISOString(),
    })),
    dispatches: dispatches.map((d) => ({
      id: d.id,
      team: teams.find((t) => t.id === d.teamId)?.name ?? d.teamId,
      detectionId: d.detectionId,
      dispatchedAt: new Date(d.dispatchedAt).toISOString(),
      arrivedAt: d.arrivedAt ? new Date(d.arrivedAt).toISOString() : null,
    })),
    timeline: timeline.map((e) => ({
      label: e.label,
      kind: e.kind,
      at: e.at ? new Date(e.at).toISOString() : null,
      state: e.state,
    })),
  };

  const exportJson = () =>
    download(`${mission.id}-report.json`, JSON.stringify(report, null, 2), 'application/json');

  const exportCsv = () =>
    download(
      `${mission.id}-detections.csv`,
      toCsv(report.detections as unknown as Record<string, string | number>[]),
      'text/csv',
    );

  return (
    <div className="h-full space-y-4 overflow-y-auto p-4">
      <PageHeader
        title="Mission report"
        description={`${mission.id} · ${mission.name} · generated ${formatDate(Date.now())} at ${formatTimeSeconds(Date.now())}`}
        actions={
          <>
            <Button icon={<Printer size={12} />} onClick={() => window.print()}>
              Export PDF
            </Button>
            <Button variant="primary" icon={<FileJson size={12} />} onClick={exportJson}>
              Export JSON
            </Button>
            <Button variant="ok" icon={<FileSpreadsheet size={12} />} onClick={exportCsv}>
              Export CSV
            </Button>
          </>
        }
      />

      <p className="rounded-control border border-info/40 bg-info/10 px-3 py-2 text-2xs text-info">
        This report is generated from locally simulated mission data. PDF export uses the browser
        print dialogue; JSON and CSV download directly.
      </p>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Panel title="Mission summary" bodyClassName="p-3">
          <Metric label="Mission" value={mission.name} />
          <Metric label="Disaster" value={humanise(mission.disaster)} />
          <Metric label="Date" value={formatDate(mission.createdAt)} />
          <Metric label="Location" value={mission.location} />
          <Metric label="Status" value={humanise(mission.status)} />
          <Metric label="Duration" value={formatDuration(telemetry.flightTimeSec)} />
        </Panel>

        <Panel title="Flight performance" bodyClassName="p-3">
          <Metric label="Search area" value={`${mission.areaKm2.toFixed(1)} km²`} />
          <Metric label="Area searched" value={`${searched.toFixed(2)} km²`} />
          <Metric label="Flight time" value={formatDuration(telemetry.flightTimeSec)} />
          <Metric label="Distance flown" value={`${telemetry.distanceKm.toFixed(2)} km`} />
          <Metric label="Maximum altitude" value={`${mission.searchAltitude} m`} />
          <Metric
            label="Battery used"
            value={`${(100 - telemetry.battery).toFixed(1)}%`}
            tone="text-warn"
          />
        </Panel>

        <Panel title="Detection performance" bodyClassName="p-3">
          <Metric label="AI detections" value={detections.length} />
          <Metric label="Confirmed" value={confirmed.length} tone="text-ok" />
          <Metric label="False detections" value={rejected.length} tone="text-dim" />
          <Metric label="Average confidence" value={`${(avgConfidence * 100).toFixed(1)}%`} tone="text-ai" />
          <Metric label="Teams dispatched" value={dispatches.length} />
          <Metric
            label="Mean response time"
            value={responseTime === null ? '—' : formatClockDuration(responseTime)}
            tone="text-action"
          />
        </Panel>
      </div>

      <Panel title="Survivor coordinates" bodyClassName="overflow-x-auto">
        <table className="w-full min-w-[600px] text-left text-xs">
          <thead className="table-head">
            <tr>
              <th scope="col" className="px-3 py-2">Survivor</th>
              <th scope="col" className="px-3 py-2">Detection</th>
              <th scope="col" className="px-3 py-2">Latitude</th>
              <th scope="col" className="px-3 py-2">Longitude</th>
              <th scope="col" className="px-3 py-2">Status</th>
              <th scope="col" className="px-3 py-2">Confirmed at</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-edge">
            {survivors.map((s) => (
              <tr key={s.id} className="row-hover">
                <td className="px-3 py-2 font-mono font-semibold">{s.id}</td>
                <td className="px-3 py-2 font-mono">{s.detectionId}</td>
                <td className="px-3 py-2 font-mono">{s.latitude.toFixed(5)}</td>
                <td className="px-3 py-2 font-mono">{s.longitude.toFixed(5)}</td>
                <td className="px-3 py-2 text-muted">{s.status.toLowerCase().replace(/_/g, ' ')}</td>
                <td className="px-3 py-2 font-mono text-dim">{formatTimeSeconds(s.confirmedAt)}</td>
              </tr>
            ))}
            {survivors.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-dim">
                  No survivors confirmed in this mission yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Panel>

      <Panel title="Event log" bodyClassName="divide-y divide-edge">
        {timeline.map((e) => (
          <div key={e.id} className="flex items-center justify-between px-3 py-1.5 text-xs">
            <span className="text-ink">{e.label}</span>
            <span className="text-2xs text-dim">{e.detail}</span>
            <span className="font-mono text-2xs text-dim">{formatTime(e.at)}</span>
          </div>
        ))}
      </Panel>
    </div>
  );
}
