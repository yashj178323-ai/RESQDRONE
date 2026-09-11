import { Check, Send, Siren, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useIncidentState, useRescueState } from '@/context/AppStore';
import { useMissionActions } from '@/hooks/useMissionActions';
import { formatClockDuration, teamStateMeta } from '@/utils/format';

/**
 * Shown once an operator confirms a survivor: which team should go, how far
 * away they are, and the reasoning behind the choice. Dispatch is the single
 * dominant action.
 */
export function TeamRecommendation({ className = '' }: { className?: string }) {
  const { recommendation, teams } = useRescueState();
  const { detections } = useIncidentState();
  const { acceptRecommendation, dismissRecommendation } = useMissionActions();

  if (!recommendation) return null;
  const team = teams.find((t) => t.id === recommendation.teamId);
  const detection = detections.find((d) => d.id === recommendation.detectionId);
  if (!team) return null;
  const stateMeta = teamStateMeta[team.state];

  return (
    <section className={`surface-action ${className}`} aria-label="Recommended rescue response">
      <header className="border-b border-edge/60 px-4 py-3">
        <p className="eyebrow flex items-center gap-1.5 text-action">
          <Siren size={13} aria-hidden />
          Recommended response
        </p>
        <div className="mt-1.5 flex items-baseline justify-between gap-3">
          <h2 className="text-xl font-semibold leading-none text-ink">{team.name}</h2>
          <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${stateMeta.text} ${stateMeta.bg}`}>
            {stateMeta.label}
          </span>
        </div>
        {detection && (
          <p className="mt-1.5 text-[13px] text-muted">
            Responding to <span className="font-mono">{detection.id}</span> · {detection.priority}
          </p>
        )}
      </header>

      <div className="space-y-4 p-4">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="label">ETA</p>
            <p className="metric-lg mt-1.5 text-action">
              {formatClockDuration(recommendation.etaSec)}
            </p>
          </div>
          <div>
            <p className="label">Distance</p>
            <p className="metric mt-2">{team.distanceKm.toFixed(1)} km</p>
          </div>
          <div>
            <p className="label">Responders</p>
            <p className="metric mt-2">{team.members}</p>
          </div>
        </div>

        <div className="border-t border-edge pt-3">
          <p className="label mb-2">Capabilities</p>
          <div className="flex flex-wrap gap-1.5">
            {team.capability.map((c) => (
              <span
                key={c}
                className="rounded border border-edge bg-panel2 px-2 py-1 text-[11px] text-muted"
              >
                {c}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="label mb-2">Why this team</p>
          <ul className="space-y-1.5">
            {recommendation.reasons.map((r) => (
              <li key={r} className="flex items-start gap-2 text-[13px] leading-snug text-muted">
                <Check size={13} className="mt-0.5 shrink-0 text-ok" aria-hidden />
                {r}
              </li>
            ))}
          </ul>
        </div>

        <Button
          variant="primary"
          className="h-11 w-full text-sm"
          icon={<Send size={15} />}
          onClick={acceptRecommendation}
        >
          Dispatch {team.name}
        </Button>
        <Button className="w-full" icon={<X size={12} />} onClick={dismissRecommendation}>
          Dismiss recommendation
        </Button>

        <p className="text-[11px] leading-relaxed text-dim">
          Dispatch orders are submitted to the response coordination system. Arrival depends on
          ground conditions.
        </p>
      </div>
    </section>
  );
}
