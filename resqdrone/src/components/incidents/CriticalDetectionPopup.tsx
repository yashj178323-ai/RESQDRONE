import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldAlert, X } from 'lucide-react';
import { useAppDispatch, useIncidentState, useMissionState } from '@/context/AppStore';
import { MAP_DETAIL_ZOOM } from '@/config/constants';
import type { Detection } from '@/types';

/**
 * A critical detection is an event, not a permanent panel.
 *
 * Detections already present when this mounts are recorded as seen, so mock
 * data never fires the alert, a re-render cannot replay it, and navigating away
 * and back does not repeat it. Only a genuinely new P1 or P2 announces itself,
 * and each detection ID announces at most once.
 */
export function CriticalDetectionPopup() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { detections } = useIncidentState();
  const { areas } = useMissionState();

  const seen = useRef<Set<string> | null>(null);
  const [event, setEvent] = useState<Detection | null>(null);

  if (seen.current === null) {
    seen.current = new Set(detections.map((d) => d.id));
  }

  useEffect(() => {
    const store = seen.current;
    if (!store) return;
    const fresh = detections.filter((d) => !store.has(d.id));
    if (fresh.length === 0) return;
    fresh.forEach((d) => store.add(d.id));

    // Only P1 and P2 interrupt; lower priorities go to the event log alone.
    const announce =
      fresh.find((d) => d.priority === 'P1') ?? fresh.find((d) => d.priority === 'P2');
    if (announce) setEvent(announce);
  }, [detections]);

  useEffect(() => {
    if (!event) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setEvent(null);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [event]);

  if (!event) return null;

  const critical = event.priority === 'P1';
  const zone = areas.find((a) => a.id === event.areaId);

  /** Reuses the existing selection flow; the Target tab picks it up from state. */
  const review = () => {
    dispatch({ type: 'incident/select', detectionId: event.id });
    dispatch({
      type: 'map/focus',
      lat: event.latitude,
      lng: event.longitude,
      zoom: MAP_DETAIL_ZOOM,
    });
    if (location.pathname !== '/live-mission') navigate('/live-mission');
    setEvent(null);
  };

  return (
    <aside
      role="alertdialog"
      aria-label={`${event.priority} detection ${event.id}`}
      className={`resq-enter fixed right-4 top-[88px] z-[1050] w-[304px] rounded-panel border bg-panel shadow-raised ${
        critical ? 'border-crit/60' : 'border-warn/60'
      }`}
    >
      <header
        className={`flex items-center gap-2 rounded-t-panel border-b px-3.5 py-2 ${
          critical ? 'border-crit/40 bg-crit/10' : 'border-warn/40 bg-warn/10'
        }`}
      >
        <ShieldAlert
          size={16}
          strokeWidth={1.8}
          className={critical ? 'text-crit' : 'text-warn'}
          aria-hidden
        />
        <p
          className={`flex-1 text-[11px] font-semibold uppercase tracking-[0.1em] ${
            critical ? 'text-crit' : 'text-warn'
          }`}
        >
          {critical ? 'Critical detection' : 'Detection'}
        </p>
        <span className={`font-mono text-[11px] ${critical ? 'text-crit' : 'text-warn'}`}>
          {event.priority}
        </span>
        <button
          type="button"
          onClick={() => setEvent(null)}
          aria-label="Dismiss alert"
          className="-mr-1 rounded p-1 text-muted transition-colors ease-ui hover:text-ink"
        >
          <X size={14} strokeWidth={1.8} aria-hidden />
        </button>
      </header>

      <div className="space-y-3 p-3.5">
        <div>
          <p className="font-mono text-lg font-semibold leading-none text-ink">{event.id}</p>
          <p className="mt-1 text-[12px] text-muted">Possible survivor detected</p>
        </div>

        <dl className="space-y-1.5 text-[12px]">
          <div className="flex justify-between gap-3">
            <dt className="text-dim">Zone</dt>
            <dd className="truncate text-ink">{zone?.name ?? 'Unassigned'}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-dim">Confidence</dt>
            <dd className={`font-mono ${critical ? 'text-crit' : 'text-warn'}`}>
              {(event.fusedConfidence * 100).toFixed(1)}%
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-dim">Position</dt>
            <dd className="font-mono text-ink">
              {event.latitude.toFixed(4)}, {event.longitude.toFixed(4)}
            </dd>
          </div>
        </dl>

        <button
          type="button"
          onClick={review}
          className="h-9 w-full rounded-control bg-brand text-[12px] font-semibold text-white transition-colors ease-ui hover:bg-brand/90"
        >
          Review detection
        </button>

        <p className="text-[10px] leading-relaxed text-dim">
          Dismissing this alert does not verify or reject the detection. It stays in the detection
          queue.
        </p>
      </div>
    </aside>
  );
}
