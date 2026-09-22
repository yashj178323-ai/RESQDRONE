import { useSystemState } from '@/context/AppStore';

/** Amber warning rendered only while GPS is lost — not a red critical alert because a functional fallback exists. */
export function GpsDeniedBanner() {
  const { connection } = useSystemState();
  if (connection.navMode !== 'GPS_DENIED') return null;
  return (
    <div role="status" aria-live="polite"
      className="flex items-center gap-3 rounded-control border border-warn/50 bg-warn/10 px-3.5 py-2">
      <span className="h-2 w-2 shrink-0 rounded-full bg-warn" aria-hidden />
      <div className="min-w-0">
        <p className="text-[12px] font-semibold text-warn">GPS signal lost</p>
        <p className="text-[11px] text-muted">
          Switching to GPS-denied navigation — optical flow + range sensing available for local motion estimation.
        </p>
      </div>
    </div>
  );
}
