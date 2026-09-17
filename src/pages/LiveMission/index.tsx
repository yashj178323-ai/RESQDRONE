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
import { THERMAL_DEFAULT_THRESHOLD_C } from '@/config/constants';

/**
 * The primary operational screen, locked to the viewport. The map dominates,
 * the payload sits beside it, and the target panel is contextual — it holds a
 * detection only once an operator has opened one.
 */
export default function LiveMissionPage() {
  const dispatch = useAppDispatch();
  const { telemetry } = useDroneState();
  const { attitude, lidar, hardware, log, thresholdC } = useSensorState();
  const { detections, selectedDetectionId } = useIncidentState();
  const { areas } = useMissionState();
  const { recommendation } = useRescueState();
  const { connection } = useSystemState();
  const { focus, toggle: toggleFocus } = useFocusMode();

  const [diagnostics, setDiagnostics] = useState(false);
  const [sensorPanel, setSensorPanel] = useState(false);
  const [demo, setDemo] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [systemOpen, setSystemOpen] = useState(false);

  // Whatever the payload overlay is tracking, this panel reviews.
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
  const pendingDetections = detections.filter((d) => d.verification === 'PENDING' || d.verification === 'UNDER_REVIEW').length;
  const searchedArea = areas.reduce((sum, area) => sum + area.areaSearchedKm2, 0);
  const totalArea = areas.reduce((sum, area) => sum + area.totalAreaKm2, 0);
  const coverage = totalArea > 0 ? Math.round((searchedArea / totalArea) * 100) : 0;

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden p-3">
      <div className="resq-live-scroll min-h-0 min-w-0 flex-1 space-y-3 overflow-y-auto overflow-x-hidden pr-1">
      <div className="flex items-center gap-2.5">
        <h1 className="shrink-0 text-[12px] font-semibold uppercase tracking-[0.12em] text-ink">
          Live mission
        </h1>
        <div className="min-w-0 flex-1">
          <MissionStatusStrip />
        </div>
        <div className="flex shrink-0 gap-1.5">
          <Button size="sm" icon={<FlaskConical size={11} />} onClick={() => setDemo(true)}>
            Simulation
          </Button>
          <Button
            size="sm"
            icon={focus ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
            onClick={toggleFocus}
            aria-pressed={focus}
            title="Mission focus mode (F)"
          >
            Focus
          </Button>
        </div>
      </div>

      <FailureBanners />

      {/* 1 — the map stays the primary surface. */}
      <CommandMap className="h-[clamp(420px,52vh,600px)] w-full min-w-0" />

      {/* 2 — RGB and thermal, side by side, directly below the map. */}
      <PayloadPanel />

      {/* 3 — one bar labelling both columns and carrying the System control. */}
      <div className="grid grid-cols-1 items-center gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink">Target</h2>

        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink">Payload</h2>

          <button
            type="button"
            onClick={() => setSystemOpen((v) => !v)}
            aria-expanded={systemOpen}
            aria-controls="system-instruments"
            title="System instruments (Y)"
            className={`flex shrink-0 items-center gap-2 rounded-control border px-2.5 py-1.5 transition-colors ease-ui ${
              systemOpen
                ? 'border-brand/50 bg-brand/10 text-brand'
                : 'border-edge2 bg-panel text-muted hover:border-muted hover:text-ink'
            }`}
          >
            <Gauge size={14} strokeWidth={1.8} aria-hidden />
            <span className="text-[11px] font-semibold uppercase tracking-[0.1em]">System</span>
            <span className="font-mono text-[11px] text-dim">
              {sensorsUp}/{hardware.length}
            </span>
            <ChevronDown
              size={13}
              strokeWidth={1.8}
              aria-hidden
              className={`transition-transform ease-ui ${systemOpen ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="flex min-w-0 flex-col gap-2.5" aria-label="Target">
          {recommendation ? (
            <TeamRecommendation />
          ) : activeTarget ? (
            <VerificationCard detection={activeTarget} />
          ) : (
            <div className="rounded-panel border border-edge bg-panel px-4 py-6 text-center">
              <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-dim">
                No target awaiting review
              </p>
              <p className="mt-2 text-[12px] leading-relaxed text-muted">
                {telemetry.droneId} continues the search. A detection opens here when the AI flags a
                possible survivor.
              </p>
            </div>
          )}
        </section>

        <section className="flex min-w-0 flex-col gap-2.5" aria-label="Payload status">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-panel border border-edge bg-panel p-3.5">
            {[
              ['RGB camera', 'ESP32-CAM · 12 fps'],
              ['Thermal', 'AMG8833 · 8×8 · 10 Hz'],
              ['Altitude', `${telemetry.altitude.toFixed(0)} m`],
              ['Heading', `${telemetry.heading.toString().padStart(3, '0')}°`],
              ['Latitude', `${telemetry.latitude.toFixed(4)}° N`],
              ['Longitude', `${telemetry.longitude.toFixed(4)}° E`],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="label">{k}</dt>
                <dd className="mt-1 font-mono text-[12px] text-ink">{v}</dd>
              </div>
            ))}
          </dl>

          <p className="rounded-control border border-warn/40 bg-warn/10 px-3 py-2 text-[11px] text-warn">
            Both feeds are generated locally and labelled simulated.
          </p>

          <Button
            className="w-full"
            icon={<SlidersHorizontal size={12} strokeWidth={1.8} />}
            onClick={() => setSensorPanel(true)}
          >
            Sensor settings
          </Button>

          <section className="rounded-panel border border-edge bg-panel" aria-label="Operational awareness">
            <header className="flex items-center justify-between border-b border-edge px-3.5 py-2.5">
              <div>
                <p className="eyebrow">Operational awareness</p>
                <p className="mt-0.5 text-[10px] text-dim">Current mission conditions</p>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-dim">LIVE STATE</span>
            </header>
            <div className="grid grid-cols-2 gap-px bg-edge">
              <div className="bg-panel p-3">
                <p className="label">Search coverage</p>
                <p className="mt-1 font-mono text-lg font-semibold text-ink">{coverage}%</p>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-panel3">
                  <div className="h-full bg-ok" style={{ width: `${coverage}%` }} />
                </div>
              </div>
              <div className="bg-panel p-3">
                <p className="label">Review queue</p>
                <p className={`mt-1 font-mono text-lg font-semibold ${pendingDetections ? 'text-warn' : 'text-ink'}`}>
                  {pendingDetections}
                </p>
                <p className="mt-1 text-[10px] text-dim">AI-assisted detections</p>
              </div>
              <div className="bg-panel p-3">
                <p className="label">GPS status</p>
                <p className={`mt-1 flex items-center gap-1.5 text-[12px] font-semibold ${gpsGood ? 'text-ok' : 'text-warn'}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${gpsGood ? 'bg-ok' : 'bg-warn'}`} aria-hidden />
                  {gpsGood ? 'LOCKED' : 'DEGRADED'}
                </p>
                <p className="mt-1 font-mono text-[10px] text-dim">{telemetry.satellites} satellites</p>
              </div>
              <div className="bg-panel p-3">
                <p className="label">Data link</p>
                <p className={`mt-1 flex items-center gap-1.5 text-[12px] font-semibold ${linkGood ? 'text-ok' : 'text-warn'}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${linkGood ? 'bg-ok' : 'bg-warn'}`} aria-hidden />
                  {linkGood ? 'CONNECTED' : 'DEGRADED'}
                </p>
                <p className="mt-1 font-mono text-[10px] text-dim">Local simulator source</p>
              </div>
            </div>
          </section>
        </section>
      </div>

      {/* 4 — instrumentation, revealed by the System control on the bar above. */}
      {systemOpen && (
        <section className="min-w-0" aria-label="System instrumentation">
          <div
            id="system-instruments"
            className="grid grid-cols-1 divide-y divide-edge rounded-panel border border-edge bg-panel md:grid-cols-2 md:divide-y-0 xl:grid-cols-4 xl:divide-x"
          >
          <div className="border-b border-edge p-4 md:border-b-0 md:border-r xl:border-r-0">
            <p className="eyebrow mb-3">Attitude</p>
            <div className="flex justify-center">
              <AttitudeIndicator attitude={attitude} />
            </div>
          </div>

          <div className="border-b border-edge p-4 md:border-b-0 xl:border-b-0">
            <p className="eyebrow mb-3">Altitude · TF-Luna</p>
            <div className="flex items-center gap-4">
              <AltitudeTape valueM={latestLidar} />
              <div className="min-w-0 flex-1">
                <LidarGraph samples={lidar} />
              </div>
            </div>
          </div>

          <div className="border-b border-edge p-4 md:border-r md:border-t xl:border-r-0 xl:border-t-0">
            <p className="eyebrow mb-3">Heading</p>
            <HeadingTape heading={telemetry.heading} />
          </div>

          <div className="p-4 md:border-t xl:border-t-0">
            <p className="eyebrow mb-3">Hardware bus</p>
            <HardwareBar links={hardware} />
            <Button
              className="mt-3 w-full"
              icon={<Settings2 size={13} strokeWidth={1.8} />}
              onClick={() => setDiagnostics(true)}
            >
              System diagnostics
            </Button>
          </div>
          </div>
        </section>
      )}

      {logOpen && <EventLog events={log.slice(-40)} className="h-[190px]" />}

      <MissionTimeline />

      <MissionStatusBar
        logOpen={logOpen}
        onToggleLog={() => setLogOpen((v) => !v)}
        eventCount={log.length}
      />

      <SystemDiagnosticsDrawer open={diagnostics} onClose={() => setDiagnostics(false)} />
      <DemoControls open={demo} onClose={() => setDemo(false)} />

      <Drawer open={sensorPanel} title="Sensor settings" onClose={() => setSensorPanel(false)}>
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
            Thermal alarm threshold
          </span>
          <input
            type="range"
            min={28}
            max={40}
            step={0.5}
            value={thresholdC}
            onChange={(e) =>
              dispatch({ type: 'sensors/setThreshold', thresholdC: Number(e.target.value) })
            }
            className="mt-3 w-full accent-info"
          />
          <span className="mt-1 block font-mono text-[13px] text-ink">
            {thresholdC.toFixed(1)} °C
          </span>
        </label>
        <p className="mt-3 text-[11px] leading-relaxed text-dim">
          A cell hotter than this raises a target reticle and an event. Peak temperature sits below
          it whenever no signature is present — that is the normal state. Default{' '}
          {THERMAL_DEFAULT_THRESHOLD_C} °C.
        </p>
        <div className="mt-6 border-t border-edge pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
            Keyboard shortcuts
          </p>
          <dl className="mt-2 space-y-1.5 text-[12px]">
            {[
              ['F', 'Focus mode'],
              ['Y', 'System instruments'],
              ['S', 'Diagnostics'],
              ['E', 'Event log'],
              ['Esc', 'Close panel'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <dt className="font-mono text-ink">{k}</dt>
                <dd className="text-muted">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <p className="mt-4 font-mono text-[10px] text-dim">
          Link: {connection.telemetryLink.toLowerCase().replace('_', ' ')}
        </p>
      </Drawer>
      </div>
    </div>
  );
}
