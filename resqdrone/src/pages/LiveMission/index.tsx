import { useEffect, useState } from 'react';
import { FlaskConical, Maximize2, Minimize2, Settings2, SlidersHorizontal } from 'lucide-react';
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
import { Tabs } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import {
  useAppDispatch,
  useDroneState,
  useIncidentState,
  useRescueState,
  useSensorState,
  useSystemState,
} from '@/context/AppStore';
import { useFocusMode } from '@/hooks/useFocusMode';
import { THERMAL_DEFAULT_THRESHOLD_C } from '@/config/constants';

type PanelTab = 'target' | 'payload' | 'system';

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
  const { recommendation } = useRescueState();
  const { connection } = useSystemState();
  const { focus, toggle: toggleFocus } = useFocusMode();

  const [tab, setTab] = useState<PanelTab>('target');
  const [diagnostics, setDiagnostics] = useState(false);
  const [sensorPanel, setSensorPanel] = useState(false);
  const [demo, setDemo] = useState(false);
  const [logOpen, setLogOpen] = useState(false);

  // Contextual, never automatic: only a detection the operator opened.
  const selected = detections.find((d) => d.id === selectedDetectionId);
  const activeTarget =
    selected && selected.verification !== 'FALSE_DETECTION' ? selected : undefined;

  useEffect(() => {
    if (activeTarget || recommendation) setTab('target');
  }, [activeTarget?.id, recommendation?.detectionId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return;
      const key = e.key.toLowerCase();
      if (key === 'f') toggleFocus();
      else if (key === 't') setTab('target');
      else if (key === 'p') setTab('payload');
      else if (key === 'y') setTab('system');
      else if (key === 's') setDiagnostics((v) => !v);
      else if (key === 'e') setLogOpen((v) => !v);
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

  return (
    <div className="h-full space-y-3 overflow-y-auto overflow-x-hidden p-3">
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
      <CommandMap className="h-[clamp(500px,52vh,600px)] w-full" />

      {/* 2 — RGB and thermal, side by side, directly below the map. */}
      <PayloadPanel />

      {/* 3 — contextual target and system information, full width. */}
      <section className="flex min-w-0 flex-col gap-2">
          <Tabs
            className="shrink-0"
            tabs={[
              { key: 'target' as const, label: 'Target' },
              { key: 'payload' as const, label: 'Payload' },
              { key: 'system' as const, label: 'System' },
            ]}
            active={tab}
            onChange={setTab}
            ariaLabel="Mission control panel"
          />

          <div className="min-h-0 flex-1">
            {tab === 'target' && (
              <div className="max-w-[560px]">
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
                    {telemetry.droneId} continues the search. A detection opens here when the AI
                    flags a possible survivor and you choose to view it.
                  </p>
                </div>
                )}
              </div>
            )}

            {tab === 'payload' && (
              <div className="max-w-[560px] space-y-2.5">
                <dl className="rounded-panel border border-edge bg-panel grid grid-cols-2 gap-x-4 gap-y-3 p-3.5">
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
                  icon={<SlidersHorizontal size={12} />}
                  onClick={() => setSensorPanel(true)}
                >
                  Sensor settings
                </Button>
              </div>
            )}

            {tab === 'system' && (
              <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                <div className="divide-y divide-edge rounded-panel border border-edge bg-panel">
                <section className="p-4">
                  <p className="eyebrow mb-3">Attitude</p>
                  <div className="flex justify-center">
                    <AttitudeIndicator attitude={attitude} />
                  </div>
                </section>

                <section className="p-4">
                  <p className="eyebrow mb-3">Altitude · TF-Luna</p>
                  <div className="flex items-center gap-5">
                    <AltitudeTape valueM={latestLidar} />
                    <div className="min-w-0 flex-1">
                      <LidarGraph samples={lidar} />
                    </div>
                  </div>
                </section>

                </div>

                <div className="divide-y divide-edge rounded-panel border border-edge bg-panel">
                <section className="p-4">
                  <p className="eyebrow mb-3">Heading</p>
                  <HeadingTape heading={telemetry.heading} />
                </section>

                <section className="p-4">
                  <p className="eyebrow mb-3">Hardware bus</p>
                  <HardwareBar links={hardware} />
                  <Button
                    className="mt-3 w-full"
                    icon={<Settings2 size={13} strokeWidth={1.8} />}
                    onClick={() => setDiagnostics(true)}
                  >
                    System diagnostics
                  </Button>
                </section>
                </div>
              </div>
            )}
        </div>
      </section>

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
            Thermal detection threshold
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
          A thermal cell above this value raises a target reticle and an event. Default{' '}
          {THERMAL_DEFAULT_THRESHOLD_C} °C.
        </p>
        <div className="mt-6 border-t border-edge pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
            Keyboard shortcuts
          </p>
          <dl className="mt-2 space-y-1.5 text-[12px]">
            {[
              ['F', 'Focus mode'],
              ['T', 'Target panel'],
              ['P', 'Payload panel'],
              ['Y', 'System panel'],
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
  );
}
