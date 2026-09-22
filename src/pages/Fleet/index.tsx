import { useMemo } from 'react';
import { MapPin, Radio, Satellite, Battery, Plane } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { Badge } from '@/components/ui/Badge';
import { useDroneState, useMissionState, useSystemState } from '@/context/AppStore';
import { droneStatusLabel } from '@/config/status';

export default function FleetPage() {
  const { drones, telemetry, activeDroneId } = useDroneState();
  const { missions } = useMissionState();
  const { connection } = useSystemState();
  const activeMission = missions.find((m) => m.status === 'ACTIVE');

  const fleet = useMemo(() => drones.map((drone) => ({
    ...drone,
    active: drone.id === activeDroneId,
    battery: drone.id === telemetry.droneId ? telemetry.battery : drone.id === 'RQ-02' ? 91 : 67,
    signal: drone.id === telemetry.droneId ? telemetry.signal : 'STRONG',
    gps: drone.id === telemetry.droneId ? telemetry.gpsStatus : 'LOCKED',
    altitude: drone.id === telemetry.droneId ? telemetry.altitude : 0,
    speed: drone.id === telemetry.droneId ? telemetry.speed : 0,
    mission: activeMission?.droneIds.includes(drone.id) ? activeMission.name : 'Standby',
  })), [activeDroneId, activeMission, drones, telemetry]);

  return (
    <div className="h-full overflow-y-auto p-4">
      <PageHeader title="Fleet" description="Multi-drone operational overview. Non-active aircraft show last-known/demo state until live fleet telemetry is connected." />
      <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4">
        <Panel title="Aircraft" bodyClassName="p-3"><strong className="font-mono text-lg text-ink">{drones.length}</strong></Panel>
        <Panel title="Active" bodyClassName="p-3"><strong className="font-mono text-lg text-ok">{drones.filter(d => d.status === 'SEARCHING' || d.status === 'AIRBORNE').length}</strong></Panel>
        <Panel title="Active mission" bodyClassName="p-3"><strong className="text-sm text-ink">{activeMission?.id ?? '—'}</strong></Panel>
        <Panel title="Fleet source" bodyClassName="p-3"><strong className="text-sm text-ink">{connection.telemetryLink === 'CONNECTED' ? 'Backend' : 'Simulation'}</strong></Panel>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {fleet.map((drone) => (
          <Panel key={drone.id} title={drone.callSign}>
            <div className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-4">
              <div><p className="label">Status</p><Badge tone={drone.status === 'SEARCHING' ? 'ok' : 'neutral'}>{droneStatusLabel[drone.status]}</Badge></div>
              <div><p className="label">Battery</p><p className="mt-1 flex items-center gap-1 font-mono text-sm text-ink"><Battery size={13} />{drone.battery.toFixed(0)}%</p></div>
              <div><p className="label">Signal</p><p className="mt-1 flex items-center gap-1 font-mono text-sm text-ink"><Radio size={13} />{drone.signal}</p></div>
              <div><p className="label">GPS</p><p className="mt-1 flex items-center gap-1 font-mono text-sm text-ink"><Satellite size={13} />{drone.gps}</p></div>
              <div className="col-span-2"><p className="label">Mission</p><p className="mt-1 text-sm text-ink">{drone.mission}</p></div>
              <div><p className="label">Altitude</p><p className="mt-1 font-mono text-sm text-ink">{drone.altitude.toFixed(0)} m</p></div>
              <div><p className="label">Speed</p><p className="mt-1 font-mono text-sm text-ink">{drone.speed.toFixed(1)} m/s</p></div>
              <div className="col-span-2 border-t border-edge pt-3"><p className="flex items-center gap-1.5 text-[11px] text-muted"><MapPin size={12} /> {drone.active ? `${telemetry.latitude.toFixed(5)}, ${telemetry.longitude.toFixed(5)}` : 'Last known position only'}</p></div>
            </div>
          </Panel>
        ))}
      </div>
      <p className="mt-4 flex items-center gap-2 text-[11px] text-dim"><Plane size={12} /> Fleet telemetry is simulated for the SIH prototype; replace the provider with live fleet telemetry at deployment.</p>
    </div>
  );
}
