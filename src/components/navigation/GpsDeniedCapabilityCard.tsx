import { Info } from 'lucide-react';

/** Static capability card for the system/diagnostics section. */
export function GpsDeniedCapabilityCard() {
  return (
    <section className="rounded-panel border border-edge bg-panel p-4" aria-label="GPS-denied navigation capability">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-control border border-edge bg-panel2">
          <Info size={16} strokeWidth={1.8} className="text-info" aria-hidden />
        </span>
        <div className="min-w-0">
          <h3 className="text-[13px] font-semibold text-ink">GPS-DENIED NAVIGATION</h3>
          <p className="mt-2 text-[12px] leading-relaxed text-muted">
            ResQDrone is designed to support local navigation when reliable GPS positioning is unavailable,
            using optical-flow-based motion estimation combined with onboard range sensing.
          </p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 border-t border-edge pt-4 sm:grid-cols-2">
        <div className="rounded-control border border-ok/30 bg-ok/5 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ok">GPS available</p>
          <ul className="mt-2 space-y-1 text-[11px] text-muted">
            <li>GPS + IMU + Range → Global positioning</li>
            <li>Mission navigation</li>
          </ul>
        </div>
        <div className="rounded-control border border-warn/30 bg-warn/5 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-warn">GPS-denied fallback</p>
          <ul className="mt-2 space-y-1 text-[11px] text-muted">
            <li>Optical flow + IMU + Range</li>
            <li>Local motion estimation</li>
            <li>Navigation continuity</li>
          </ul>
        </div>
      </div>
      <p className="mt-3 text-[10px] leading-relaxed text-dim">
        Prototype demonstration. Optical-flow hardware configurable. Global coordinates require an
        external positioning reference in GPS-denied mode.
      </p>
    </section>
  );
}
