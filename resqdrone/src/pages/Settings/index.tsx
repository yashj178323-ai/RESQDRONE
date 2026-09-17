import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { Button } from '@/components/ui/Button';
import { StatusDot } from '@/components/ui/StatusDot';
import { useAppDispatch, useMapState, useSystemState } from '@/context/AppStore';
import { useTheme } from '@/context/ThemeContext';
import { Tabs } from '@/components/ui/Tabs';
import { useMissionActions } from '@/hooks/useMissionActions';
import { mapTileUrl } from '@/services/telemetry/telemetryLink';
import type { MapLayerToggles } from '@/types';

const LAYERS: { key: keyof MapLayerToggles; label: string }[] = [
  { key: 'drones', label: 'Drones' },
  { key: 'detections', label: 'AI detections' },
  { key: 'survivors', label: 'Confirmed survivors' },
  { key: 'teams', label: 'Rescue teams' },
  { key: 'searchArea', label: 'Search areas' },
  { key: 'coverage', label: 'Coverage overlay' },
  { key: 'incidents', label: 'Incidents' },
  { key: 'flightPath', label: 'Flight path' },
];

const TRANSPORT_LABEL: Record<string, string> = {
  NOT_CONFIGURED: 'Not configured',
  CONNECTING: 'Connecting',
  CONNECTED: 'Connected',
  DEGRADED: 'Degraded',
  OFFLINE: 'Unreachable',
};

const LINK_LABEL: Record<string, string> = {
  LOCAL_SIMULATOR: 'Local simulator',
  CONNECTING: 'Connecting',
  CONNECTED: 'Live backend',
  DEGRADED: 'Degraded, using simulator',
  OFFLINE: 'Unreachable, using simulator',
};

const SHORTCUTS = [
  ['Tab / Shift+Tab', 'Move between controls, with a visible focus ring'],
  ['Enter or Space', 'Activate the focused control'],
  ['Escape', 'Close the create-mission dialogue'],
  ['Enter in map search', 'Jump to a detection ID or search zone'],
];

export default function SettingsPage() {
  const dispatch = useAppDispatch();
  const { layers } = useMapState();
  const { health, connection } = useSystemState();
  const { theme, setTheme } = useTheme();
  const { toggleThermal, toggleAiEngine, restoreGps, restoreDroneLink, replayMission } =
    useMissionActions();

  return (
    <div className="h-full space-y-4 overflow-y-auto p-4">
      <PageHeader
        title="Settings and help"
        description="Data sources, map layers, subsystem simulation and keyboard help for this ground station."
      />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Panel title="Appearance" bodyClassName="space-y-2 p-3">
          <p className="text-2xs text-muted">
            Light suits daylight operations rooms; dark suits night shifts and command vehicles. The
            choice is remembered on this device.
          </p>
          <Tabs
            tabs={[
              { key: 'light' as const, label: 'Light' },
              { key: 'dark' as const, label: 'Dark' },
            ]}
            active={theme}
            onChange={setTheme}
            ariaLabel="Interface theme"
          />
        </Panel>

        <Panel title="Data sources" bodyClassName="space-y-2 p-3">
          <StatusDot
            tone={
              connection.restApi === 'CONNECTED'
                ? 'ok'
                : connection.restApi === 'NOT_CONFIGURED'
                  ? 'neutral'
                  : 'warn'
            }
            label="REST API (VITE_API_URL)"
            value={TRANSPORT_LABEL[connection.restApi]}
          />
          <StatusDot
            tone={
              connection.websocket === 'CONNECTED'
                ? 'ok'
                : connection.websocket === 'NOT_CONFIGURED'
                  ? 'neutral'
                  : 'warn'
            }
            label="WebSocket (VITE_WS_URL)"
            value={TRANSPORT_LABEL[connection.websocket]}
          />
          <StatusDot
            tone={connection.telemetryLink === 'CONNECTED' ? 'ok' : 'info'}
            label="Telemetry source"
            value={LINK_LABEL[connection.telemetryLink]}
          />
          <p className="pt-1 text-2xs text-dim">
            Map tiles: <span className="font-mono">{mapTileUrl}</span>
          </p>
          <p className="text-2xs text-muted">
            Configuration is not connection. A URL in <span className="font-mono">.env</span> only
            moves the link to <span className="font-mono">CONNECTING</span>; it reports
            <span className="font-mono"> CONNECTED</span> once a real telemetry frame arrives, and
            falls back to the simulator if frames stop.
          </p>
        </Panel>

        <Panel title="Map layers" bodyClassName="grid grid-cols-2 gap-1 p-3">
          {LAYERS.map((l) => (
            <label
              key={l.key}
              className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-xs text-muted hover:bg-panel2 hover:text-ink"
            >
              <input
                type="checkbox"
                checked={layers[l.key]}
                onChange={() => dispatch({ type: 'map/toggleLayer', key: l.key })}
                className="h-3 w-3 accent-info"
              />
              {l.label}
            </label>
          ))}
        </Panel>

        <Panel title="Subsystem simulation" bodyClassName="space-y-2 p-3">
          <p className="text-2xs text-muted">
            Force a subsystem into a failure state to rehearse how the interface degrades.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={health.thermalCamera === 'OFFLINE' ? 'ok' : 'warn'}
              onClick={() => toggleThermal(health.thermalCamera === 'OFFLINE')}
            >
              {health.thermalCamera === 'OFFLINE' ? 'Bring thermal online' : 'Take thermal offline'}
            </Button>
            <Button
              variant={health.aiEngine === 'OFFLINE' ? 'ok' : 'warn'}
              onClick={() => toggleAiEngine(health.aiEngine === 'OFFLINE')}
            >
              {health.aiEngine === 'OFFLINE' ? 'Bring AI online' : 'Take AI offline'}
            </Button>
            <Button variant="primary" onClick={restoreGps} disabled={connection.gps === 'LOCKED'}>
              Restore GPS lock
            </Button>
            <Button
              variant="primary"
              onClick={restoreDroneLink}
              disabled={connection.droneLink === 'CONNECTED'}
            >
              Restore drone link
            </Button>
            <Button variant="danger" onClick={replayMission}>
              Reset mission state
            </Button>
          </div>
        </Panel>

        <Panel title="Keyboard and accessibility" bodyClassName="p-3">
          <dl className="space-y-1.5">
            {SHORTCUTS.map(([k, v]) => (
              <div key={k} className="flex items-start justify-between gap-4 text-xs">
                <dt className="font-mono text-ink">{k}</dt>
                <dd className="text-right text-2xs text-muted">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-2xs text-dim">
            Status is always shown as an icon or word alongside colour, so the interface stays
            readable without colour perception.
          </p>
        </Panel>
      </div>

      <Panel title="Operational safety" bodyClassName="p-3 space-y-1.5">
        <p className="text-xs text-muted">
          The AI proposes; a person decides. A detection is never presented as a survivor until an
          operator has verified it.
        </p>
        <p className="text-xs text-muted">
          Commands issued here are submitted to the flight-control system. The interface reports what
          was sent and what was acknowledged; it cannot guarantee physical behaviour of the aircraft.
        </p>
        <p className="text-xs text-muted">
          Losing the internet does not mean losing the drone. Link states are reported separately and
          events are queued locally until an uplink returns.
        </p>
      </Panel>
    </div>
  );
}
