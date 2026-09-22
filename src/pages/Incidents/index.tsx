import { MapPin, Radio, Users } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { Badge } from '@/components/ui/Badge';
import { useIncidentState, useRescueState } from '@/context/AppStore';
import { formatTime } from '@/utils/format';

const stateTone: Record<string, 'ok' | 'warn' | 'info' | 'crit' | 'neutral'> = {
  OPEN: 'warn', DISPATCHED: 'info', RESOLVED: 'ok', CLOSED: 'neutral',
};

export default function IncidentsPage() {
  const { incidents, detections, survivors } = useIncidentState();
  const { teams, dispatches } = useRescueState();
  return (
    <div className="h-full overflow-y-auto p-4">
      <PageHeader title="Incidents" description="Structured case records connecting AI-assisted detections, operator verification and responder dispatch." />
      <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4">
        <Panel title="Open" bodyClassName="p-3"><strong className="font-mono text-lg text-warn">{incidents.filter(i => i.state === 'OPEN').length}</strong></Panel>
        <Panel title="Dispatched" bodyClassName="p-3"><strong className="font-mono text-lg text-info">{incidents.filter(i => i.state === 'DISPATCHED').length}</strong></Panel>
        <Panel title="Resolved" bodyClassName="p-3"><strong className="font-mono text-lg text-ok">{incidents.filter(i => i.state === 'RESOLVED').length}</strong></Panel>
        <Panel title="Response teams" bodyClassName="p-3"><strong className="font-mono text-lg text-ink">{teams.length}</strong></Panel>
      </div>
      <Panel title="Incident register">
        <div className="divide-y divide-edge">
          {incidents.map((incident) => {
            const detection = detections.find(d => d.id === incident.detectionId);
            const survivor = survivors.find(s => s.detectionId === incident.detectionId);
            const dispatch = dispatches.find(d => d.detectionId === incident.detectionId);
            return (
              <article key={incident.id} className="grid gap-3 p-3 md:grid-cols-[150px_1fr_auto] md:items-center">
                <div><p className="font-mono text-[12px] text-ink">{incident.id}</p><p className="text-[10px] text-dim">Opened {formatTime(incident.openedAt)}</p></div>
                <div className="grid gap-2 sm:grid-cols-4">
                  <div><p className="label">Priority</p><Badge tone={incident.priority === 'P1' ? 'crit' : 'warn'}>{incident.priority}</Badge></div>
                  <div><p className="label">Detection</p><p className="mt-1 font-mono text-[11px] text-ink">{incident.detectionId}</p></div>
                  <div><p className="label">Location</p><p className="mt-1 flex items-center gap-1 text-[11px] text-muted"><MapPin size={11}/>{detection ? `${detection.latitude.toFixed(4)}, ${detection.longitude.toFixed(4)}` : '—'}</p></div>
                  <div><p className="label">Response</p><p className="mt-1 flex items-center gap-1 text-[11px] text-muted">{dispatch ? <><Radio size={11}/> {dispatch.teamId}</> : survivor ? <><Users size={11}/> Awaiting dispatch</> : 'Awaiting verification'}</p></div>
                </div>
                <Badge tone={stateTone[incident.state] ?? 'neutral'}>{incident.state}</Badge>
              </article>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
