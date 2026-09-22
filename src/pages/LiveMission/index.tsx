import { useEffect, useState } from 'react';
import {
  ChevronDown,
  FlaskConical,
  Gauge,
  Maximize2,
  Minimize2,
  Settings2,
  SlidersHorizontal,
} from 'lucide-react';
import { CommandMap } from '@/components/map/CommandMap';
import { PayloadPanel } from '@/components/payload/PayloadPanel';
import { MissionStatusStrip } from '@/components/mission/MissionStatusStrip';
import { MissionStatusBar } from '@/components/mission/MissionStatusBar';
import { MissionTimeline } from '@/components/timeline/MissionTimeline';
import { SystemDiagnosticsDrawer } from '@/components/system/SystemDiagnosticsDrawer';
import { DemoControls } from '@/components/demo/DemoControls';
import { VerificationCard } from '@/components/incidents/VerificationCard';
import { TeamRecommendation } from '@/components/rescue/TeamRecommendation';
import { FailureBanners } from '@/components/telemetry/FailureBanners';
import { AttitudeIndicator } from '@/components/hud/AttitudeIndicator';
import { AltitudeTape } from '@/components/hud/AltitudeTape';
import { HeadingTape } from '@/components/hud/HeadingTape';
import { HardwareBar } from '@/components/hud/HardwareBar';
import { LidarGraph } from '@/components/hud/LidarGraph';
import { EventLog } from '@/components/hud/EventLog';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import {
  useAppDispatch,
  useDroneState,
  useIncidentState,
  useMissionState,
  useRescueState,
  useSensorState,
  useSystemState,
} from '@/context/AppStore';
import { useFocusMode } from '@/hooks/useFocusMode';
import { useActiveTarget } from '@/hooks/useActiveTarget';
import { NavModeCard } from '@/components/navigation/NavModeCard';
import { GpsDeniedBanner } from '@/components/navigation/GpsDeniedBanner';
import { THERMAL_DEFAULT_THRESHOLD_C } from '@/config/constants';

/** Primary operational screen. The viewport itself never scrolls; only the
 * compact workspace can scroll when a short laptop viewport genuinely needs it. */
export default function LiveMissionPage() {
  const dispatch = useAppDispatch();
  const { telemetry } = useDroneState();
  const { attitude, lidar, hardware, log, thresholdC } = useSensorState();
  const { detections } = useIncidentState();
  const { areas } = useMissionState();
  const { recommendation } = useRescueState();
  const { connection } = useSystemState();
  const { focus, toggle: toggleFocus } = useFocusMode();

  const [diagnostics, setDiagnostics] = useState(false);
  const [sensorPanel, setSensorPanel] = useState(false);
  const [demo, setDemo] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [systemOpen, setSystemOpen] = useState(false);
  const activeTarget = useActiveTarget();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return;
      const key = e.key.toLowerCase();
      if (key === 'f') toggleFocus();
      else if (key === 's') setDiagnostics((v) => !v);
      else if (key === 'e') setLogOpen((v) => !v);
      else if (key === 'y') setSystemOpen((v) => !v);
      else if (e.key === 'Escape') {
        setDiagnostics(false);
        setSensorPanel(false);
        setDemo(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleFocus]);

  const latestLidar = lidar[lidar.length - 1]?.distanceM ?? 0;
  const sensorsUp = hardware.filter((h) => h.state !== 'OFFLINE').length;
  const gpsGood = connection.gps === 'LOCKED';
  const linkGood = connection.droneLink === 'CONNECTED' && connection.telemetry === 'CONNECTED';
  const pendingDetections = detections.filter(
    (d) => d.verification === 'PENDING' || d.verification === 'UNDER_REVIEW',
  ).length;
  const searchedArea = areas.reduce((sum, area) => sum + area.areaSearchedKm2, 0);
  const totalArea = areas.reduce((sum, area) => sum + area.totalAreaKm2, 0);
  const coverage = totalArea > 0 ? Math.round((searchedArea / totalArea) * 100) : 0;

  return (
    <div className="live-mission-page flex h-full min-h-0 min-w-0 flex-col overflow-hidden p-3">
      <div className="live-mission-workspace min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden pr-1">
        <div className="flex min-w-0 flex-col gap-3 pb-1">
          <header className="live-mission-header flex min-w-0 flex-wrap items-center gap-2.5 rounded-panel border border-edge bg-panel px-3 py-2">
            <div className="flex shrink-0 items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-ok shadow-[0_0_0_3px_rgb(var(--ok)/0.12)]" aria-hidden />
              <h1 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-ink">Live mission</h1>
            </div>
            <div className="min-w-0 flex-1"><MissionStatusStrip /></div>
            <div className="flex shrink-0 gap-1.5">
              <Button size="sm" icon={<FlaskConical size={11} />} onClick={() => setDemo(true)}>Simulation</Button>
              <Button size="sm" icon={focus ? <Minimize2 size={11} /> : <Maximize2 size={11} />} onClick={toggleFocus} aria-pressed={focus} title="Mission focus mode (F)">Focus</Button>
            </div>
          </header>

          <FailureBanners />
      <GpsDeniedBanner />

          {/* Command workspace: map is dominant, operational context stays beside it. */}
          <section className="live-command-grid grid min-w-0 gap-3" aria-label="Live operational picture">
            <div className="live-map-surface min-w-0 overflow-hidden rounded-panel border border-edge bg-panel shadow-card">
              <div className="flex items-center justify-between border-b border-edge bg-panel px-3 py-2">
                <div>
                  <p className="eyebrow">Common operating picture</p>
                  <p className="mt-0.5 text-[10px] text-dim">RQ-01 · Search zone A · {coverage}% coverage</p>
                </div>
                <span className="rounded border border-warn/35 bg-warn/10 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-warn">SIMULATED</span>
              </div>
              <div className="live-map-frame min-w-0"><CommandMap className="h-full w-full min-w-0 rounded-none border-0 shadow-none" /></div>
            </div>

            <aside className="live-context-panel flex min-w-0 flex-col gap-3" aria-label="Live mission context">
              <section className="surface shrink-0 p-3.5">
                <div className="flex items-center justify-between">
                  <p className="eyebrow">Flight telemetry</p>
                  <span className="font-mono text-[10px] text-ok">{linkGood ? 'LINK OK' : 'DEGRADED'}</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
                  <div><p className="label">Altitude</p><p className="metric-lg mt-1">{telemetry.altitude.toFixed(0)} <span className="text-xs text-dim">m</span></p></div>
                  <div><p className="label">Speed</p><p className="metric-lg mt-1">{telemetry.speed.toFixed(1)} <span className="text-xs text-dim">m/s</span></p></div>
                  <div><p className="label">Heading</p><p className="metric mt-2">{telemetry.heading.toString().padStart(3, '0')}°</p></div>
                  <div><p className="label">Battery</p><p className="metric mt-2 text-ok">{telemetry.battery.toFixed(0)}%</p></div>
                </div>
              </section>

              <section className="surface shrink-0 p-3.5">
                <div className="flex items-center justify-between">
                  <p className="eyebrow">Navigation & sensors</p>
                  <button type="button" onClick={() => setSystemOpen((v) => !v)} aria-expanded={systemOpen} className="rounded-control border border-edge2 px-2 py-1 text-[10px] text-muted hover:text-ink">
                    <span className="inline-flex items-center gap-1.5"><Gauge size={12} /> {sensorsUp}/{hardware.length}</span>
                  </button>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-control border border-edge bg-panel2 p-2.5"><p className="label">GPS</p><p className={`mt-1 text-[12px] font-semibold ${gpsGood ? 'text-ok' : 'text-warn'}`}>{gpsGood ? 'LOCKED' : 'UNAVAILABLE'}</p><p className="mt-0.5 font-mono text-[10px] text-dim">{gpsGood ? `${telemetry.satellites} satellites` : 'no fix'}</p></div>
                  <div className="rounded-control border border-edge bg-panel2 p-2.5"><p className="label">Optical flow</p><p className={`mt-1 text-[12px] font-semibold ${gpsGood ? 'text-muted' : 'text-ok'}`}>{gpsGood ? 'READY' : 'ACTIVE'}</p><p className="mt-0.5 text-[10px] text-dim">motion estimation</p></div>
                  <div className="rounded-control border border-edge bg-panel2 p-2.5"><p className="label">Range / Lidar</p><p className="mt-1 font-mono text-[12px] font-semibold text-ink">{latestLidar.toFixed(1)} m</p><p className="mt-0.5 text-[10px] text-dim">TF-Luna</p></div>
                  <div className="rounded-control border border-edge bg-panel2 p-2.5"><p className="label">Nav mode</p><p className={`mt-1 text-[12px] font-semibold ${gpsGood ? 'text-ok' : 'text-warn'}`}>{gpsGood ? 'GPS NAV' : 'GPS-DENIED'}</p><p className="mt-0.5 text-[10px] text-dim">{gpsGood ? 'global' : 'local motion'}</p></div>
                  <div className="rounded-control border border-edge bg-panel2 p-2.5"><p className="label">Review queue</p><p className={`mt-1 font-mono text-[12px] font-semibold ${pendingDetections ? 'text-warn' : 'text-ink'}`}>{pendingDetections} pending</p></div>
                  <div className="rounded-control border border-edge bg-panel2 p-2.5"><p className="label">Coverage</p><p className="mt-1 font-mono text-[12px] font-semibold text-ink">{coverage}%</p></div>
                </div>

                {/*
                  The explicit capability statement. Worded as a supported
                  fallback rather than a claim that GPS is unnecessary.
                */}
                <p
                  className={`mt-2.5 rounded-control border px-2.5 py-2 text-[10px] leading-relaxed ${
                    gpsGood
                      ? 'border-edge bg-panel2 text-dim'
                      : 'border-warn/40 bg-warn/10 text-warn'
                  }`}
                  title="GPS-denied navigation uses optical flow and range sensing to estimate local motion when GPS positioning is unavailable. Global coordinates may not be available without an external positioning reference."
                >
                  {gpsGood
                    ? 'Supports navigation without GPS — optical flow and range sensing provide local motion estimation if GPS becomes unavailable.'
                    : 'GPS unavailable — navigating without GPS using optical flow and range sensing for local motion estimation.'}
                </p>
              </section>

              <section className="surface flex flex-col" aria-label="Target review">
                <div className="flex shrink-0 items-center justify-between border-b border-edge px-3.5 py-2.5">
                  <div><p className="eyebrow">AI-assisted review</p><p className="mt-0.5 text-[10px] text-dim">Human verification required</p></div>
                  <span className={`rounded px-2 py-1 font-mono text-[10px] ${pendingDetections ? 'bg-warn/10 text-warn' : 'bg-ok/10 text-ok'}`}>{pendingDetections} OPEN</span>
                </div>
                <div className="p-2.5">
                  {recommendation ? <TeamRecommendation /> : activeTarget ? <VerificationCard detection={activeTarget} /> : (
                    <div className="flex h-full min-h-[170px] flex-col items-center justify-center rounded-control border border-dashed border-edge2 bg-panel2 px-5 text-center">
                      <div className="grid h-9 w-9 place-items-center rounded-full border border-edge2 text-dim"><span className="h-2 w-2 rounded-full bg-ok" /></div>
                      <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink">No active review</p>
                      <p className="mt-1.5 max-w-[240px] text-[10px] leading-relaxed text-dim">{telemetry.droneId} is continuing the search. New AI-assisted detections will appear here.</p>
                    </div>
                  )}
                </div>
              </section>
            </aside>
          </section>

          {/* Compact sensor evidence row; no giant camera cards competing with the map. */}
          <PayloadPanel className="live-payload-panel" />

          {systemOpen && (
            <section className="min-w-0" aria-label="System instrumentation">
              <div id="system-instruments" className="grid grid-cols-1 divide-y divide-edge rounded-panel border border-edge bg-panel md:grid-cols-2 md:divide-y-0 xl:grid-cols-4 xl:divide-x">
                <div className="p-3 md:border-r xl:border-r-0"><p className="eyebrow mb-2">Attitude</p><div className="flex justify-center"><AttitudeIndicator attitude={attitude} /></div></div>
                <div className="p-3 md:border-b-0"><p className="eyebrow mb-2">Altitude · TF-Luna</p><div className="flex items-center gap-3"><AltitudeTape valueM={latestLidar} /><div className="min-w-0 flex-1"><LidarGraph samples={lidar} /></div></div></div>
                <div className="p-3 md:border-r xl:border-r-0"><p className="eyebrow mb-2">Heading</p><HeadingTape heading={telemetry.heading} /></div>
                <div className="p-3"><p className="eyebrow mb-2">Hardware bus</p><HardwareBar links={hardware} /><Button className="mt-2.5 w-full" icon={<Settings2 size={13} strokeWidth={1.8} />} onClick={() => setDiagnostics(true)}>System diagnostics</Button></div>
              </div>
            </section>
          )}

          {logOpen && <EventLog events={log.slice(-40)} className="h-[160px]" />}

          <MissionTimeline />
          <MissionStatusBar logOpen={logOpen} onToggleLog={() => setLogOpen((v) => !v)} eventCount={log.length} />
        </div>
      </div>

      <SystemDiagnosticsDrawer open={diagnostics} onClose={() => setDiagnostics(false)} />
      <DemoControls open={demo} onClose={() => setDemo(false)} />

      <Drawer open={sensorPanel} title="Sensor settings" onClose={() => setSensorPanel(false)}>
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Thermal alarm threshold</span>
          <input type="range" min={28} max={40} step={0.5} value={thresholdC} onChange={(e) => dispatch({ type: 'sensors/setThreshold', thresholdC: Number(e.target.value) })} className="mt-3 w-full accent-info" />
          <span className="mt-1 block font-mono text-[13px] text-ink">{thresholdC.toFixed(1)} °C</span>
        </label>
        <p className="mt-3 text-[11px] leading-relaxed text-dim">A cell hotter than this raises a target reticle and an event. Default {THERMAL_DEFAULT_THRESHOLD_C} °C.</p>
        <div className="mt-6 border-t border-edge pt-4"><p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Keyboard shortcuts</p><dl className="mt-2 space-y-1.5 text-[12px]">{[['F', 'Focus mode'], ['Y', 'System instruments'], ['S', 'Diagnostics'], ['E', 'Event log'], ['Esc', 'Close panel']].map(([k, v]) => <div key={k} className="flex justify-between"><dt className="font-mono text-ink">{k}</dt><dd className="text-muted">{v}</dd></div>)}</dl></div>
        <p className="mt-4 font-mono text-[10px] text-dim">Link: {connection.telemetryLink.toLowerCase().replace('_', ' ')}</p>
      </Drawer>
    </div>
  );
}
