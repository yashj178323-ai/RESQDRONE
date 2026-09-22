import type {
  Alert,
  AuditEvent,
  Attitude,
  HardwareLink,
  LidarSample,
  SensorEvent,
  ThermalFrame,
  ThermalPalette,
  BaseLayerKey,
  ConnectionStatus,
  Detection,
  Dispatch,
  Drone,
  Incident,
  LatLng,
  MapLayerToggles,
  Mission,
  MissionEvent,
  QueuedEvent,
  RescueTeam,
  SearchArea,
  Survivor,
  SystemHealth,
  Telemetry,
} from '@/types';
import {
  DETECTIONS,
  DRONES,
  INCIDENTS,
  INITIAL_ALERTS,
  INITIAL_DISPATCHES,
  INITIAL_HARDWARE,
  INITIAL_SENSOR_LOG,
  makeThermalFrame,
  INITIAL_HEALTH,
  INITIAL_TELEMETRY,
  INITIAL_TIMELINE,
  MISSIONS,
  RESCUE_TEAMS,
  SEARCH_AREAS,
  SURVIVORS,
} from '@/data/mockData';
import { THERMAL_DEFAULT_THRESHOLD_C } from '@/config/constants';

/**
 * Operational state is split into independent slices. Each slice owns its own
 * reducer; a single dispatch fans one action out to every slice so that a
 * cross-cutting event (an operator confirming a survivor) can update the
 * incident, the mission timeline and the alert feed atomically.
 */

export interface DroneSlice {
  drones: Drone[];
  activeDroneId: string;
  telemetry: Telemetry;
  /** Normalised 0..1 position along the planned search path. */
  pathProgress: number;
  travelled: LatLng[];
  simulating: boolean;
}

export interface MissionSlice {
  missions: Mission[];
  areas: SearchArea[];
  activeMissionId: string;
  selectedAreaId: string;
  timeline: MissionEvent[];
}

export interface IncidentSlice {
  detections: Detection[];
  survivors: Survivor[];
  incidents: Incident[];
  selectedDetectionId: string | null;
}

export interface Recommendation {
  detectionId: string;
  teamId: string;
  etaSec: number;
  reasons: string[];
}

export interface RescueSlice {
  teams: RescueTeam[];
  dispatches: Dispatch[];
  recommendation: Recommendation | null;
}

export interface SyncState {
  total: number;
  done: number;
  complete: boolean;
}

export interface SystemSlice {
  connection: ConnectionStatus;
  health: SystemHealth;
  alerts: Alert[];
  audit: AuditEvent[];
  queue: QueuedEvent[];
  sync: SyncState | null;
}

export interface SensorSlice {
  hardware: HardwareLink[];
  attitude: Attitude;
  lidar: LidarSample[];
  thermal: ThermalFrame;
  palette: ThermalPalette;
  thresholdC: number;
  selectedCell: number | null;
  targetLocked: boolean;
  log: SensorEvent[];
}

export interface MapSlice {
  base: BaseLayerKey;
  layers: MapLayerToggles;
  focus: { lat: number; lng: number; zoom: number; nonce: number } | null;
}

export interface AppState {
  drone: DroneSlice;
  sensors: SensorSlice;
  mission: MissionSlice;
  incidents: IncidentSlice;
  rescue: RescueSlice;
  system: SystemSlice;
  map: MapSlice;
}

export const initialState: AppState = {
  drone: {
    drones: DRONES,
    activeDroneId: 'RQ-01',
    telemetry: INITIAL_TELEMETRY,
    pathProgress: 0.68,
    travelled: [],
    simulating: true,
  },
  sensors: {
    hardware: INITIAL_HARDWARE,
    attitude: { pitch: 1.4, roll: -2.1, yaw: 127 },
    lidar: [],
    thermal: makeThermalFrame(0, false),
    palette: 'IRONBOW',
    thresholdC: THERMAL_DEFAULT_THRESHOLD_C,
    selectedCell: null,
    targetLocked: false,
    log: INITIAL_SENSOR_LOG,
  },
  mission: {
    missions: MISSIONS,
    areas: SEARCH_AREAS,
    activeMissionId: 'FLOOD-042',
    selectedAreaId: 'ZONE-A',
    timeline: INITIAL_TIMELINE,
  },
  incidents: {
    detections: DETECTIONS,
    survivors: SURVIVORS,
    incidents: INCIDENTS,
    selectedDetectionId: null,
  },
  rescue: {
    teams: RESCUE_TEAMS,
    dispatches: INITIAL_DISPATCHES,
    recommendation: null,
  },
  system: {
    connection: {
      droneLink: 'CONNECTED',
      telemetry: 'CONNECTED',
      gps: 'LOCKED',
      navMode: 'GPS',
      opticalFlow: 'READY',
      rangeSensor: 'ACTIVE',
      internet: 'OFFLINE',
      cloud: 'OFFLINE',
      lastTelemetryAt: Date.now(),
      telemetryLink: 'LOCAL_SIMULATOR',
      restApi: 'NOT_CONFIGURED',
      websocket: 'NOT_CONFIGURED',
    },
    health: INITIAL_HEALTH,
    alerts: INITIAL_ALERTS,
    audit: [],
    queue: [],
    sync: null,
  },
  map: {
    base: 'MAP',
    layers: {
      drones: true,
      detections: true,
      survivors: true,
      teams: true,
      searchArea: true,
      coverage: true,
      incidents: true,
      flightPath: true,
    },
    focus: null,
  },
};

export type { QueuedEvent };
