import { useState } from 'react';
import { Check, ChevronDown, CircleHelp, MapPin, ShieldAlert, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AiFusion } from './AiFusion';
import { useIncidentState, useMissionState, useSystemState } from '@/context/AppStore';
import { useMissionActions } from '@/hooks/useMissionActions';
import { formatTime, priorityMeta, verificationMeta } from '@/utils/format';
import type { Detection } from '@/types';

function ageLabel(timestamp: number): string {
  const mins = Math.max(0, Math.round((Date.now() - timestamp) / 60_000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  return `${Math.floor(mins / 60)} h ${mins % 60} min ago`;
}

/**
 * The most important component in the product: the point where a model's output
 * becomes a human decision. The confirm action is deliberately dominant, and
 * the language never calls an unverified detection a survivor.
 */
export function VerificationCard({
  detection,
  className = '',
}: {
  detection: Detection;
  className?: string;
}) {
  const { confirmDetection, rejectDetection, markUncertain, focusOn, detailZoom } =
    useMissionActions();
  const { survivors } = useIncidentState();
  const { areas } = useMissionState();
  const { health } = useSystemState();

  const [showAnalysis, setShowAnalysis] = useState(false);
  const pMeta = priorityMeta[detection.priority];
  const vMeta = verificationMeta[detection.verification];
  const decided =
    detection.verification === 'CONFIRMED' || detection.verification === 'FALSE_DETECTION';
  const survivor = survivors.find((s) => s.detectionId === detection.id);
  const zone = areas.find((a) => a.id === detection.areaId);
  const critical = detection.priority === 'P1';

  return (
    <section
      className={`${critical ? 'surface-critical' : 'surface-action'} ${className}`}
      aria-label={`Detection ${detection.id} awaiting verification`}
    >
      <header className="flex items-start justify-between gap-3 border-b border-edge/60 px-3.5 py-2.5">
        <div>
          <p className={`eyebrow flex items-center gap-1.5 ${critical ? 'text-crit' : 'text-action'}`}>
            <ShieldAlert size={12} aria-hidden />
            {critical ? 'Critical detection' : 'Detection'}
          </p>
          <h2 className="mt-1 font-mono text-lg font-semibold leading-none text-ink">
            {detection.id}
          </h2>
          <p className="mt-1 text-[12px] text-muted">
            Possible survivor · {zone?.name ?? 'Unassigned'} · {ageLabel(detection.timestamp)}
          </p>
        </div>
        <span
          className={`shrink-0 rounded border px-2 py-1 text-[11px] font-semibold ${pMeta.text} ${pMeta.bg} ${pMeta.border}`}
        >
          {detection.priority}
        </span>
      </header>

      <div className="space-y-3 p-3.5">
        <AiFusion detection={detection} thermalAvailable={health.thermalCamera !== 'OFFLINE'} />

        <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
          <div>
            <dt className="label">Coordinates</dt>
            <dd className="mt-1 font-mono text-[12px] leading-snug text-ink">
              {detection.latitude.toFixed(4)}° N
              <br />
              {detection.longitude.toFixed(4)}° E
            </dd>
          </div>
          <div>
            <dt className="label">Altitude / time</dt>
            <dd className="mt-1 font-mono text-[12px] leading-snug text-ink">
              {detection.altitude.toFixed(0)} m
              <br />
              {formatTime(detection.timestamp)}
            </dd>
          </div>
        </dl>

        {/* Reasoning is collapsed so the decision stays above the fold. */}
        <div className="rounded-control border border-edge">
          <button
            type="button"
            aria-expanded={showAnalysis}
            onClick={() => setShowAnalysis((v) => !v)}
            className="flex w-full items-center justify-between px-3 py-2 text-[12px] font-medium text-muted transition-colors ease-ui hover:text-ink"
          >
            Why {detection.priority}
            <ChevronDown
              size={13}
              aria-hidden
              className={`transition-transform ease-ui ${showAnalysis ? 'rotate-180' : ''}`}
            />
          </button>
          {showAnalysis && (
            <ul className="space-y-1.5 border-t border-edge px-3 py-2.5">
              {detection.reasons.map((r) => (
                <li key={r} className="flex items-start gap-2 text-[12px] leading-snug text-muted">
                  <Check size={12} className="mt-0.5 shrink-0 text-ok" aria-hidden />
                  {r}
                </li>
              ))}
              {detection.note && (
                <li className="pt-1 text-[11px] text-dim">Operator note: {detection.note}</li>
              )}
            </ul>
          )}
        </div>

        {survivor ? (
          <p className="rounded-panel border border-ok/40 bg-ok/10 px-3 py-2.5 text-[13px] font-medium text-ok">
            Confirmed as {survivor.id} · {survivor.status.toLowerCase().replace(/_/g, ' ')}
          </p>
        ) : decided ? (
          <p className={`rounded-panel border px-3 py-2.5 text-[13px] ${vMeta.bg} ${vMeta.border} ${vMeta.text}`}>
            {vMeta.label} — closed by the operator.
          </p>
        ) : (
          <>
            {/* One dominant decision; everything else is deliberately quiet. */}
            <Button
              variant="primary"
              className="h-10 w-full text-[13px]"
              icon={<Check size={15} />}
              onClick={() => confirmDetection(detection.id)}
            >
              Confirm survivor
            </Button>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="warn"
                icon={<CircleHelp size={12} />}
                onClick={() => markUncertain(detection.id)}
              >
                Uncertain
              </Button>
              <Button
                variant="danger"
                icon={<X size={12} />}
                onClick={() => rejectDetection(detection.id)}
              >
                Reject
              </Button>
              <Button
                icon={<MapPin size={12} />}
                onClick={() => focusOn(detection.latitude, detection.longitude, detailZoom)}
              >
                Map
              </Button>
            </div>
          </>
        )}

        <p className="text-[10px] leading-relaxed text-dim">
          The AI proposes; the operator decides. Unverified until you confirm.
        </p>
      </div>
    </section>
  );
}
