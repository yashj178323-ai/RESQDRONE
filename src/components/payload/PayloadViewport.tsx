import { SimulatedCamera } from '@/components/video/SimulatedCamera';
import { useDroneState, useSystemState } from '@/context/AppStore';
import { useActiveTarget } from '@/hooks/useActiveTarget';
import { formatTimeSeconds } from '@/utils/format';

/**
 * The RGB payload viewport. Overlays carry the flight context an operator needs
 * while watching the feed, and the frame is always labelled as simulated.
 */
export function PayloadViewport({ className = '' }: { className?: string }) {
  const { telemetry } = useDroneState();
  const { connection, health } = useSystemState();

  const linkLost = connection.droneLink === 'LOST';
  const cameraOffline = health.rgbCamera === 'OFFLINE';
  // Same source as the Target panel: a box on screen always has a review card.
  const target = useActiveTarget();

  if (cameraOffline) {
    return (
      <section className={`surface-evidence flex items-center justify-center ${className}`}>
        <p className="text-[13px] font-medium text-warn">RGB camera offline · thermal remains available</p>
      </section>
    );
  }

  return (
    <section className={`surface-evidence relative ${className}`} aria-label="RGB payload">
      <SimulatedCamera mode="RGB" frozen={linkLost} className="absolute inset-0" />

      {/* Corner brackets, kept subtle: instrumentation, not movie graphics. */}
      <span className="pointer-events-none absolute left-3 top-3 h-5 w-5 border-l border-t border-white/35" />
      <span className="pointer-events-none absolute right-3 top-3 h-5 w-5 border-r border-t border-white/35" />
      <span className="pointer-events-none absolute bottom-3 left-3 h-5 w-5 border-b border-l border-white/35" />
      <span className="pointer-events-none absolute bottom-3 right-3 h-5 w-5 border-b border-r border-white/35" />

      <div className="pointer-events-none absolute left-5 top-5 space-y-1 font-mono text-[11px] text-white/90">
        <p className="flex items-center gap-1.5 font-semibold">
          <span className={`h-1.5 w-1.5 rounded-full ${linkLost ? 'bg-dim' : 'bg-crit'}`} aria-hidden />
          {linkLost ? 'LAST FRAME' : 'LIVE · SIMULATED'}
        </p>
        <p>{telemetry.droneId} · ESP32-CAM</p>
      </div>

      <div className="pointer-events-none absolute right-5 top-5 space-y-0.5 text-right font-mono text-[11px] text-white/85">
        <p>ALT {telemetry.altitude.toFixed(0)} m</p>
        <p>HDG {telemetry.heading.toString().padStart(3, '0')}°</p>
      </div>

      {target && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="h-24 w-16 border-2 border-crit" />
          <p className="mt-1 whitespace-nowrap bg-crit px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
            {target.id} · {(target.rgbConfidence * 100).toFixed(0)}%
          </p>
          {/* The detection's own position — not the aircraft's. */}
          <p className="mt-0.5 whitespace-nowrap text-center font-mono text-[10px] text-white/85">
            {target.latitude.toFixed(4)}, {target.longitude.toFixed(4)}
          </p>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/85 to-transparent px-5 pb-4 pt-8 font-mono text-[11px] text-white/90">
        <p className="truncate">
          RQ-01 {telemetry.latitude.toFixed(4)}° N · {telemetry.longitude.toFixed(4)}° E
        </p>
        <p className="shrink-0">{linkLost ? 'NO SIGNAL' : formatTimeSeconds(telemetry.updatedAt)}</p>
      </div>
    </section>
  );
}
