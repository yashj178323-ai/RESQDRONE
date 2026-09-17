import type {
  Alert,
  AlertLevel,
  BaseLayerKey,
  Detection,
  Dispatch,
  LatLng,
  MapLayerToggles,
  Mission,
  MissionEvent,
  Priority,
  QueuedEvent,
  QueuedEventKind,
  SubsystemKey,
  SubsystemState,
  SystemHealth,
  Telemetry,
  Verification,
} from '@/types';
import type { ConnectionStatus } from '@/types';
import type { Recommendation } from './state';
import { uid } from '@/utils/format';

export type AppAction =
  /* drone */
  | { type: 'drone/tick'; telemetry: Partial<Telemetry>; pathProgress: number; point: LatLng }
  | { type: 'drone/setSimulating'; value: boolean }
  | { type: 'drone/patch'; telemetry: Partial<Telemetry> }
  /* sensors */
  | { type: 'sensors/attitude'; attitude: import('@/types').Attitude }
  | { type: 'sensors/lidar'; sample: import('@/types').LidarSample }
  | { type: 'sensors/thermal'; frame: import('@/types').ThermalFrame }
  | { type: 'sensors/setPalette'; palette: import('@/types').ThermalPalette }
  | { type: 'sensors/setThreshold'; thresholdC: number }
  | { type: 'sensors/selectCell'; index: number | null }
  | { type: 'sensors/setTargetLock'; locked: boolean }
  | {
      type: 'sensors/setHardware';
      key: import('@/types').HardwareKey;
      patch: Partial<import('@/types').HardwareLink>;
    }
  | { type: 'sensors/log'; event: import('@/types').SensorEvent }
  /* mission */
  | { type: 'mission/selectArea'; areaId: string }
  | { type: 'mission/setAreaProgress'; areaId: string; progress: number; areaSearchedKm2: number }
  | { type: 'mission/patchArea'; areaId: string; patch: Partial<import('@/types').SearchArea> }
  | { type: 'mission/setStatus'; missionId: string; status: Mission['status'] }
  | { type: 'mission/create'; mission: Mission; area: import('@/types').SearchArea }
  | { type: 'mission/addEvent'; event: MissionEvent }
  | { type: 'mission/resolveEvent'; kind: MissionEvent['kind']; at: number; detail?: string }
  | { type: 'mission/reset' }
  /* incidents */
  | { type: 'incident/select'; detectionId: string | null }
  | { type: 'incident/add'; detection: Detection; incidentId: string }
  | { type: 'incident/setVerification'; detectionId: string; verification: Verification; note?: string }
  | {
      type: 'incident/confirm';
      detectionId: string;
      survivorId: string;
      at: number;
    }
  /* rescue */
  | { type: 'rescue/recommend'; recommendation: Recommendation }
  | { type: 'rescue/dismissRecommendation' }
  | { type: 'rescue/dispatch'; dispatch: Dispatch; route: LatLng[] }
  | { type: 'rescue/tick'; seconds: number }
  | { type: 'rescue/arrived'; teamId: string; at: number }
  /* system */
  | { type: 'system/alert'; alert: Alert }
  | { type: 'system/readAlerts' }
  | { type: 'system/setConnection'; patch: Partial<ConnectionStatus> }
  | { type: 'system/setHealth'; patch: Partial<SystemHealth> }
  | { type: 'system/queue'; event: QueuedEvent }
  | { type: 'system/startSync'; total: number }
  | { type: 'system/syncTick' }
  | { type: 'system/syncComplete' }
  /* map */
  | { type: 'map/setBase'; base: BaseLayerKey }
  | { type: 'map/toggleLayer'; key: keyof MapLayerToggles }
  | { type: 'map/focus'; lat: number; lng: number; zoom?: number }
  /* global */
  | { type: 'app/reset' };

/* ------------------------------ creators ------------------------------ */

export function makeAlert(
  level: AlertLevel,
  title: string,
  detail?: string,
): AppAction {
  return {
    type: 'system/alert',
    alert: { id: uid('AL'), level, title, detail, at: Date.now(), read: false },
  };
}

export function makeEvent(
  missionId: string,
  kind: MissionEvent['kind'],
  label: string,
  detail?: string,
  state: MissionEvent['state'] = 'DONE',
): AppAction {
  return {
    type: 'mission/addEvent',
    event: { id: uid('EV'), missionId, kind, label, detail, at: Date.now(), state },
  };
}

/**
 * Queued events carry a deterministic idempotency key (kind + subject) so that
 * repeating an operator action cannot enqueue it twice.
 */
export function makeQueued(kind: QueuedEventKind, payload: string): AppAction {
  return {
    type: 'system/queue',
    event: { id: `${kind}:${payload}`, kind, payload, queuedAt: Date.now(), status: 'QUEUED' },
  };
}

export function logEvent(
  source: import('@/types').EventSource,
  message: string,
  level: import('@/types').SensorEvent['level'] = 'INFO',
): AppAction {
  return { type: 'sensors/log', event: { id: uid('LOG'), at: Date.now(), source, message, level } };
}

export function subsystem(key: SubsystemKey, value: SubsystemState): AppAction {
  return { type: 'system/setHealth', patch: { [key]: value } as Partial<SystemHealth> };
}

/** Priority derived from fused confidence and environmental context. */
export function derivePriority(fused: number, thermalAgrees: boolean): Priority {
  if (fused >= 0.9 && thermalAgrees) return 'P1';
  if (fused >= 0.8) return 'P2';
  if (fused >= 0.65) return 'P3';
  return 'P4';
}
