import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react';
import { useAppDispatch, useIncidentState, useSystemState } from '@/context/AppStore';
import { MAP_DETAIL_ZOOM } from '@/config/constants';
import type { AlertLevel } from '@/types';

const META: Record<AlertLevel, { icon: typeof Info; label: string; text: string; rail: string }> = {
  CRITICAL: { icon: CircleAlert, label: 'P1', text: 'text-crit', rail: 'border-l-crit' },
  WARNING: { icon: TriangleAlert, label: 'Warning', text: 'text-warn', rail: 'border-l-warn' },
  SUCCESS: { icon: CircleCheck, label: 'Confirmed', text: 'text-ok', rail: 'border-l-ok' },
  INFO: { icon: Info, label: 'Info', text: 'text-muted', rail: 'border-l-edge2' },
};

function ago(at: number): string {
  const mins = Math.max(0, Math.round((Date.now() - at) / 60_000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  return `${Math.floor(mins / 60)} h ago`;
}

/**
 * Rendered through a portal so no overflow-hidden ancestor or stacking context
 * in the header chrome can clip or hide it. Position is measured from the
 * trigger on open and refreshed on resize.
 */
export function NotificationsPopover({
  anchorRef,
  open,
  onClose,
}: {
  anchorRef: React.RefObject<HTMLElement>;
  open: boolean;
  onClose: () => void;
}) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { alerts } = useSystemState();
  const { detections } = useIncidentState();

  const panelRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPos({ top: rect.bottom + 8, right: Math.max(8, window.innerWidth - rect.right) });
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [anchorRef, open]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return; // the trigger toggles itself
      onClose();
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [anchorRef, onClose, open]);

  if (!open || !pos) return null;

  /** An alert naming a detection opens it through the existing selection flow. */
  const openDetection = (title: string, detail?: string) => {
    const match = `${title} ${detail ?? ''}`.match(/DET-\d+/);
    if (!match) return;
    const detection = detections.find((d) => d.id === match[0]);
    if (!detection) return;
    dispatch({ type: 'incident/select', detectionId: detection.id });
    dispatch({
      type: 'map/focus',
      lat: detection.latitude,
      lng: detection.longitude,
      zoom: MAP_DETAIL_ZOOM,
    });
    navigate('/live-mission');
    onClose();
  };

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Notifications"
      style={{ top: pos.top, right: pos.right }}
      className="fixed z-[1200] w-[352px] overflow-hidden rounded-panel border border-edge bg-panel shadow-raised"
    >
      <header className="flex items-center justify-between border-b border-edge px-3.5 py-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-dim">
          Notifications
        </p>
        <button
          type="button"
          onClick={() => dispatch({ type: 'system/readAlerts' })}
          className="text-[11px] font-medium text-brand transition-colors ease-ui hover:underline"
        >
          Mark all read
        </button>
      </header>

      {alerts.length === 0 ? (
        <p className="px-3.5 py-8 text-center text-[12px] text-dim">No notifications.</p>
      ) : (
        <ul className="max-h-[380px] divide-y divide-edge overflow-y-auto">
          {alerts.slice(0, 12).map((a) => {
            const meta = META[a.level];
            const Icon = meta.icon;
            const linked = /DET-\d+/.test(`${a.title} ${a.detail ?? ''}`);
            return (
              <li key={a.id}>
                <button
                  type="button"
                  disabled={!linked}
                  onClick={() => openDetection(a.title, a.detail)}
                  className={`flex w-full gap-3 border-l-2 px-3.5 py-2.5 text-left transition-colors ease-ui ${meta.rail} ${
                    linked ? 'hover:bg-panel2' : 'cursor-default'
                  } ${a.read ? '' : 'bg-panel2/60'}`}
                >
                  <Icon size={14} strokeWidth={1.8} className={`mt-0.5 shrink-0 ${meta.text}`} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-[0.1em] ${meta.text}`}
                      >
                        {meta.label}
                      </span>
                      <span className="shrink-0 font-mono text-[10px] text-dim">{ago(a.at)}</span>
                    </span>
                    <span className="mt-1 block truncate text-[12px] text-ink">{a.title}</span>
                    {a.detail && (
                      <span className="mt-0.5 block truncate text-[11px] text-dim">{a.detail}</span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>,
    document.body,
  );
}
