import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { TeamCard } from '@/components/rescue/TeamCard';
import { TeamRecommendation } from '@/components/rescue/TeamRecommendation';
import { CommandMap } from '@/components/map/CommandMap';
import { useIncidentState, useRescueState } from '@/context/AppStore';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatClockDuration, formatTime, teamStateMeta } from '@/utils/format';

export default function RescueTeamsPage() {
  const { teams, dispatches } = useRescueState();
  const { detections, survivors } = useIncidentState();

  const dispatchable = detections.filter((d) => d.verification === 'CONFIRMED');
  const [target, setTarget] = useState<string>(dispatchable[0]?.id ?? '');

  const counts = teams.reduce<Record<string, number>>((acc, t) => {
    acc[t.state] = (acc[t.state] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="h-full space-y-4 overflow-y-auto p-4">
      <PageHeader
        title="Rescue teams"
        description="Ground teams, their capability and live ETA. Dispatch orders are submitted to the response coordination system."
        actions={
          <label className="text-2xs text-dim">
            Dispatch target
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="ml-2 rounded-control border border-edge bg-panel2 px-2 py-1 text-xs text-ink"
            >
              {dispatchable.length === 0 && <option value="">No confirmed survivors yet</option>}
              {dispatchable.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.id} · {d.priority}
                </option>
              ))}
            </select>
          </label>
        }
      />

      <div className="flex flex-wrap gap-2">
        {Object.entries(teamStateMeta).map(([key, meta]) => (
          <span
            key={key}
            className={`rounded-control border border-edge px-2 py-1 text-2xs font-semibold ${meta.text} ${meta.bg}`}
          >
            {meta.label}: {counts[key] ?? 0}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[380px_minmax(0,1fr)]">
        <div className="space-y-3">
          <TeamRecommendation />
          {teams.map((t) => (
            <TeamCard key={t.id} team={t} dispatchTarget={target || undefined} />
          ))}
        </div>

        <div className="space-y-3">
          <CommandMap className="h-[420px]" />
          <Panel title="Dispatch log" bodyClassName="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-xs">
              <thead className="table-head">
                <tr>
                  <th scope="col" className="px-3 py-2">Dispatch</th>
                  <th scope="col" className="px-3 py-2">Team</th>
                  <th scope="col" className="px-3 py-2">Target</th>
                  <th scope="col" className="px-3 py-2">Sent</th>
                  <th scope="col" className="px-3 py-2">ETA</th>
                  <th scope="col" className="px-3 py-2">Arrived</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-edge">
                {dispatches.map((d) => (
                  <tr key={d.id} className="row-hover">
                    <td className="px-3 py-2 font-mono">{d.id.slice(0, 12)}</td>
                    <td className="px-3 py-2">{teams.find((t) => t.id === d.teamId)?.name}</td>
                    <td className="px-3 py-2 font-mono">{d.detectionId}</td>
                    <td className="px-3 py-2 font-mono text-dim">{formatTime(d.dispatchedAt)}</td>
                    <td className="px-3 py-2 font-mono text-action">
                      {d.arrivedAt ? '—' : formatClockDuration(d.etaSec)}
                    </td>
                    <td className="px-3 py-2 font-mono text-ok">
                      {d.arrivedAt ? formatTime(d.arrivedAt) : '—'}
                    </td>
                  </tr>
                ))}
                {dispatches.length === 0 && (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState
                        title="No teams dispatched yet"
                        detail="Confirm a survivor and a recommendation with reasoning appears here."
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Panel>
          <Panel title="Confirmed survivors" bodyClassName="divide-y divide-edge">
            {survivors.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-3 py-2 text-xs">
                <span className="font-mono font-semibold">{s.id}</span>
                <span className="font-mono text-dim">
                  {s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}
                </span>
                <span className="text-muted">{s.status.toLowerCase().replace(/_/g, ' ')}</span>
                <span className="font-mono text-dim">{formatTime(s.confirmedAt)}</span>
              </div>
            ))}
            {survivors.length === 0 && (
              <EmptyState
                title="No survivors confirmed yet"
                detail="An AI detection becomes a survivor only after an operator verifies it."
              />
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
