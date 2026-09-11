import { useState } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAppDispatch, useMissionState } from '@/context/AppStore';
import { useMissionActions } from '@/hooks/useMissionActions';
import { formatDate, formatDuration, humanise } from '@/utils/format';
import { polygonAreaKm2, rectAround } from '@/utils/geo';
import { PUNE_CENTER } from '@/data/mockData';
import type { DisasterType, Mission, Priority, SearchArea, SearchPattern } from '@/types';

const DISASTERS: DisasterType[] = [
  'FLOOD',
  'EARTHQUAKE',
  'LANDSLIDE',
  'CYCLONE',
  'FIRE',
  'BUILDING_COLLAPSE',
];
const PATTERNS: SearchPattern[] = ['LAWNMOWER', 'SPIRAL', 'PERIMETER', 'GRID'];

const field = 'mt-1 w-full rounded-control border border-edge bg-panel2 px-2 py-1.5 text-xs text-ink focus:border-info';

function MissionTable({ rows, title }: { rows: Mission[]; title: string }) {
  const dispatch = useAppDispatch();
  return (
    <Panel title={title} bodyClassName="overflow-x-auto">
      <table className="w-full min-w-[820px] text-left text-xs">
        <thead className="table-head">
          <tr>
            <th scope="col" className="px-3 py-2">Mission ID</th>
            <th scope="col" className="px-3 py-2">Disaster</th>
            <th scope="col" className="px-3 py-2">Location</th>
            <th scope="col" className="px-3 py-2">Area</th>
            <th scope="col" className="px-3 py-2">Duration</th>
            <th scope="col" className="px-3 py-2">Survivors</th>
            <th scope="col" className="px-3 py-2">Teams</th>
            <th scope="col" className="px-3 py-2">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-edge">
          {rows.map((m) => (
            <tr
              key={m.id}
              className="row-hover cursor-pointer"
              onClick={() => dispatch({ type: 'map/focus', lat: PUNE_CENTER.lat, lng: PUNE_CENTER.lng, zoom: 14 })}
            >
              <td className="px-3 py-2 font-mono font-semibold">{m.id}</td>
              <td className="px-3 py-2">{humanise(m.disaster)}</td>
              <td className="px-3 py-2 text-muted">{m.location}</td>
              <td className="px-3 py-2 font-mono">{m.areaKm2.toFixed(1)} km²</td>
              <td className="px-3 py-2 font-mono">{formatDuration(m.durationSec)}</td>
              <td className="px-3 py-2 font-mono text-ok">{m.survivorsConfirmed}</td>
              <td className="px-3 py-2 font-mono">{m.teamsDispatched}</td>
              <td className="px-3 py-2">
                <Badge tone={m.status === 'ACTIVE' ? 'ok' : m.status === 'COMPLETED' ? 'info' : 'neutral'}>
                  {humanise(m.status)}
                </Badge>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={8}>
                <EmptyState title={`No ${title.toLowerCase()}`} detail="Create a mission to plan a new search." />
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </Panel>
  );
}

export default function MissionsPage() {
  const { missions } = useMissionState();
  const { createMission } = useMissionActions();
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    id: `FLOOD-${String(43 + missions.length).padStart(3, '0')}`,
    name: 'Mission Bravo',
    disaster: 'FLOOD' as DisasterType,
    location: 'Sinhagad Road, Pune, Maharashtra',
    areaKm2: 3.5,
    droneId: 'RQ-02',
    altitude: 85,
    pattern: 'LAWNMOWER' as SearchPattern,
    priority: 'P2' as Priority,
    teamId: 'TEAM-BRAVO',
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = () => {
    const polygon = rectAround(
      { lat: PUNE_CENTER.lat - 0.03, lng: PUNE_CENTER.lng - 0.02 },
      Math.sqrt(form.areaKm2) * 1.15,
      Math.sqrt(form.areaKm2) * 0.87,
    );
    const mission: Mission = {
      id: form.id,
      name: form.name,
      disaster: form.disaster,
      location: form.location,
      status: 'PLANNED',
      priority: form.priority,
      createdAt: Date.now(),
      droneIds: [form.droneId],
      areaKm2: Number(polygonAreaKm2(polygon).toFixed(1)),
      searchAltitude: form.altitude,
      pattern: form.pattern,
      survivorsConfirmed: 0,
      teamsDispatched: 0,
      durationSec: 0,
      assignedTeamId: form.teamId,
    };
    const area: SearchArea = {
      id: `${form.id}-ZONE-A`,
      missionId: form.id,
      name: `${form.name} — Zone A`,
      status: 'PENDING',
      progress: 0,
      areaSearchedKm2: 0,
      totalAreaKm2: mission.areaKm2,
      flightTimeSec: 0,
      distanceKm: 0,
      detections: 0,
      verified: 0,
      polygon,
    };
    createMission(mission, area);
    setOpen(false);
  };

  const active = missions.filter((m) => m.status === 'ACTIVE' || m.status === 'PLANNED');
  const completed = missions.filter((m) => m.status === 'COMPLETED' || m.status === 'ABORTED');

  return (
    <div className="h-full space-y-4 overflow-y-auto p-4">
      <PageHeader
        title="Missions"
        description={`${active.length} active or planned · ${completed.length} completed · created ${formatDate(Date.now())}`}
        actions={
          <Button variant="primary" icon={<Plus size={12} />} onClick={() => setOpen(true)}>
            Create mission
          </Button>
        }
      />

      <MissionTable title="Active missions" rows={active} />
      <MissionTable title="Completed missions" rows={completed} />

      <Modal
        open={open}
        title="Create mission"
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="ok" onClick={submit}>
              Create mission
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="text-2xs text-dim">
            Mission ID
            <input className={field} value={form.id} onChange={(e) => set('id', e.target.value)} />
          </label>
          <label className="text-2xs text-dim">
            Mission name
            <input className={field} value={form.name} onChange={(e) => set('name', e.target.value)} />
          </label>
          <label className="text-2xs text-dim">
            Disaster type
            <select
              className={field}
              value={form.disaster}
              onChange={(e) => set('disaster', e.target.value as DisasterType)}
            >
              {DISASTERS.map((d) => (
                <option key={d} value={d}>
                  {humanise(d)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-2xs text-dim">
            Mission location
            <input
              className={field}
              value={form.location}
              onChange={(e) => set('location', e.target.value)}
            />
          </label>
          <label className="text-2xs text-dim">
            Search area (km²)
            <input
              type="number"
              min={0.5}
              step={0.1}
              className={field}
              value={form.areaKm2}
              onChange={(e) => set('areaKm2', Number(e.target.value))}
            />
          </label>
          <label className="text-2xs text-dim">
            Drone
            <select className={field} value={form.droneId} onChange={(e) => set('droneId', e.target.value)}>
              <option value="RQ-01">RQ-01</option>
              <option value="RQ-02">RQ-02</option>
            </select>
          </label>
          <label className="text-2xs text-dim">
            Search altitude (m)
            <input
              type="number"
              min={30}
              max={120}
              className={field}
              value={form.altitude}
              onChange={(e) => set('altitude', Number(e.target.value))}
            />
          </label>
          <label className="text-2xs text-dim">
            Search pattern
            <select
              className={field}
              value={form.pattern}
              onChange={(e) => set('pattern', e.target.value as SearchPattern)}
            >
              {PATTERNS.map((p) => (
                <option key={p} value={p}>
                  {humanise(p)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-2xs text-dim">
            Mission priority
            <select
              className={field}
              value={form.priority}
              onChange={(e) => set('priority', e.target.value as Priority)}
            >
              <option value="P1">P1 — critical</option>
              <option value="P2">P2 — high</option>
              <option value="P3">P3 — medium</option>
              <option value="P4">P4 — low</option>
            </select>
          </label>
          <label className="text-2xs text-dim">
            Rescue team on call
            <select className={field} value={form.teamId} onChange={(e) => set('teamId', e.target.value)}>
              <option value="TEAM-ALPHA">Team Alpha</option>
              <option value="TEAM-BRAVO">Team Bravo</option>
              <option value="TEAM-CHARLIE">Team Charlie</option>
            </select>
          </label>
        </div>
        <p className="mt-3 text-2xs text-dim">
          The mission is created locally and a Zone A polygon is generated near the demonstration
          area. Launch authority still rests with the flight-control system.
        </p>
      </Modal>
    </div>
  );
}
