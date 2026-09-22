/** Domain model for the ResQDrone ground command centre. */

export type LatLng = { lat: number; lng: number };

/* ------------------------------ Drone / telemetry ------------------------------ */

export type GpsStatus = 'LOCKED' | 'DEGRADED' | 'NO_FIX';
export type NavMode = 'GPS' | 'GPS_DENIED';
export type SensorReadiness = 'READY' | 'ACTIVE' | 'UNAVAILABLE';
export type LinkStatus = 'CONNECTED' | 'DEGRADED' | 'LOST';
export type DroneMissionStatus =
  | 'IDLE'
  | 'PREFLIGHT'
  | 'AIRBORNE'
  | 'SEARCHING'
  | 'RETURNING'
  | 'LANDED';

export interface Drone {
  id: string;
  model: string;
  callSign: string;
  status: DroneMissionStatus;
}

export interface Telemetry {
  droneId: string;
  latitude: number;
  longitude: number;
  altitude: number; // metres AGL
  speed: number; // m/s
  heading: number; // degrees
  battery: number; // percent
  satellites: number;
  signal: 'STRONG' | 'FAIR' | 'WEAK' | 'NONE';
  gpsStatus: GpsStatus;
  communication: LinkStatus;
  missionStatus: DroneMissionStatus;
  flightTimeSec: number;
  distanceKm: number;
  updatedAt: number;
}

export type SubsystemKey =
  | 'flightController'
  | 'gps'
  | 'motors'
  | 'battery'
  | 'rgbCamera'
  | 'thermalCamera'
  | 'aiEngine'
  | 'communication';

export type SubsystemState = 'ONLINE' | 'HEALTHY' | 'NORMAL' | 'ACTIVE' | 'DEGRADED' | 'OFFLINE';

export type SystemHealth = Record<SubsystemKey, SubsystemState>;

export interface AuditEvent {
  id: string;
  at: number;
  operatorId: string;
  role: string;
  action: string;
  detail: string;
}


/**
 * Whether live telemetry is actually flowing. Configuration is not connection:
 * a URL in .env only ever produces CONNECTING until a frame arrives.
 */
export type TelemetryLinkState =
  | 'LOCAL_SIMULATOR'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'DEGRADED'
  | 'OFFLINE';

export type TransportState = 'NOT_CONFIGURED' | 'CONNECTING' | 'CONNECTED' | 'DEGRADED' | 'OFFLINE';

export interface ConnectionStatus {
  droneLink: LinkStatus;
  telemetry: LinkStatus;
  gps: GpsStatus;
  navMode: NavMode;
  opticalFlow: SensorReadiness;
  rangeSensor: SensorReadiness;
  internet: 'ONLINE' | 'OFFLINE';
  cloud: 'ONLINE' | 'OFFLINE' | 'SYNCING';
  lastTelemetryAt: number;
  /** Where the telemetry on screen is actually coming from. */
  telemetryLink: TelemetryLinkState;
  restApi: TransportState;
  websocket: TransportState;
}

/* ------------------------------ Sensors / avionics ------------------------------ */

export type HardwareState = 'CONNECTED' | 'ACTIVE' | 'STREAMING' | 'LOCK' | 'DEGRADED' | 'OFFLINE';

export type HardwareKey = 'pixhawk' | 'tfLuna' | 'esp32Cam' | 'amg8833';

export interface HardwareLink {
  key: HardwareKey;
  name: string;
  state: HardwareState;
  /** Short technical detail line, e.g. "MAVLink v2.0 · 115200". */
  detail: string;
  /** False whenever the reading comes from the local simulator. */
  live: boolean;
}

/** Attitude from the flight controller, in degrees. */
export interface Attitude {
  pitch: number;
  roll: number;
  yaw: number;
}

export type ThermalPalette = 'IRONBOW' | 'RAINBOW' | 'WHITE_HOT' | 'BLACK_HOT';

/** One AMG8833 frame: an 8x8 grid of temperatures in Celsius, row-major. */
export interface ThermalFrame {
  grid: number[];
  size: number;
  minC: number;
  maxC: number;
  /** Index of the hottest cell in `grid`. */
  hotIndex: number;
  at: number;
}

export interface LidarSample {
  t: number;
  distanceM: number;
}

export type EventSource = 'PIXHAWK' | 'TF-LUNA' | 'ESP32-CAM' | 'AMG8833' | 'AI' | 'OPERATOR' | 'SYSTEM';

export interface SensorEvent {
  id: string;
  at: number;
  source: EventSource;
  message: string;
  level: 'INFO' | 'WARN' | 'CRITICAL' | 'OK';
}

/* ------------------------------ Mission ------------------------------ */

export type MissionStatus = 'PLANNED' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ABORTED';
export type SearchAreaStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
export type SearchPattern = 'LAWNMOWER' | 'SPIRAL' | 'PERIMETER' | 'GRID';
export type DisasterType =
  | 'FLOOD'
  | 'EARTHQUAKE'
  | 'LANDSLIDE'
  | 'CYCLONE'
  | 'FIRE'
  | 'BUILDING_COLLAPSE';

export interface SearchArea {
  id: string;
  missionId: string;
  name: string;
  status: SearchAreaStatus;
  progress: number; // 0..100
  areaSearchedKm2: number;
  totalAreaKm2: number;
  flightTimeSec: number;
  distanceKm: number;
  detections: number;
  verified: number;
  polygon: LatLng[];
}

export interface Mission {
  id: string;
  name: string;
  disaster: DisasterType;
  location: string;
  status: MissionStatus;
  priority: 'P1' | 'P2' | 'P3' | 'P4';
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  droneIds: string[];
  areaKm2: number;
  searchAltitude: number;
  pattern: SearchPattern;
  survivorsConfirmed: number;
  teamsDispatched: number;
  durationSec: number;
  assignedTeamId?: string;
}

export type MissionEventKind =
  | 'MISSION_CREATED'
  | 'DRONE_LAUNCHED'
  | 'SEARCH_STARTED'
  | 'DETECTION'
  | 'AWAITING_VERIFICATION'
  | 'VERIFIED'
  | 'REJECTED'
  | 'TEAM_DISPATCHED'
  | 'TEAM_ARRIVED'
  | 'FAULT'
  | 'RECOVERY'
  | 'SYNC'
  | 'MISSION_COMPLETE';

export interface MissionEvent {
  id: string;
  missionId: string;
  kind: MissionEventKind;
  label: string;
  detail?: string;
  at: number | null; // null = milestone not reached yet
  state: 'DONE' | 'ACTIVE' | 'PENDING' | 'FAILED';
}

/* ------------------------------ Detection / incident ------------------------------ */

export type Priority = 'P1' | 'P2' | 'P3' | 'P4';
export type Verification =
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'CONFIRMED'
  | 'FALSE_DETECTION'
  | 'UNCERTAIN';

export interface Detection {
  id: string;
  missionId: string;
  droneId: string;
  areaId: string;
  timestamp: number;
  rgbConfidence: number;
  thermalConfidence: number;
  fusedConfidence: number;
  latitude: number;
  longitude: number;
  altitude: number;
  priority: Priority;
  verification: Verification;
  reasons: string[];
  note?: string;
}

/** A detection promoted to a survivor by a human operator. */
export interface Survivor {
  id: string;
  detectionId: string;
  latitude: number;
  longitude: number;
  priority: Priority;
  confirmedAt: number;
  status: 'AWAITING_DISPATCH' | 'TEAM_EN_ROUTE' | 'RESCUED';
  assignedTeamId?: string;
}

export type IncidentState = 'OPEN' | 'DISPATCHED' | 'RESOLVED' | 'CLOSED';

export interface Incident {
  id: string;
  detectionId: string;
  priority: Priority;
  state: IncidentState;
  openedAt: number;
  teamId?: string;
}

/* ------------------------------ Rescue ------------------------------ */

export type TeamState =
  | 'AVAILABLE'
  | 'STANDBY'
  | 'DISPATCHED'
  | 'ON_WAY'
  | 'ARRIVED'
  | 'UNAVAILABLE';

export interface RescueTeam {
  id: string;
  name: string;
  state: TeamState;
  latitude: number;
  longitude: number;
  distanceKm: number;
  etaSec: number;
  capability: string[];
  members: number;
  assignmentId?: string;
  route?: LatLng[];
}

export interface Dispatch {
  id: string;
  teamId: string;
  detectionId: string;
  survivorId?: string;
  dispatchedAt: number;
  etaSec: number;
  arrivedAt?: number;
  reasons: string[];
}

/* ------------------------------ Alerts / sync ------------------------------ */

export type AlertLevel = 'CRITICAL' | 'WARNING' | 'INFO' | 'SUCCESS';

export interface Alert {
  id: string;
  level: AlertLevel;
  title: string;
  detail?: string;
  at: number;
  read: boolean;
}

/** Operator actions that need the cloud are queued locally while it is away. */
export type QueuedEventKind =
  | 'DETECTION'
  | 'DETECTION_REVIEWED'
  | 'DETECTION_REJECTED'
  | 'DETECTION_UNCERTAIN'
  | 'SURVIVOR_CONFIRMED'
  | 'TEAM_DISPATCHED'
  | 'TEAM_ARRIVED'
  | 'MISSION_CREATED'
  | 'MISSION_STATUS';

export interface QueuedEvent {
  /** Idempotency key: re-queuing the same operator action is a no-op. */
  id: string;
  kind: QueuedEventKind;
  payload: string;
  queuedAt: number;
  status: 'QUEUED' | 'SYNCED';
}

/* ------------------------------ Map ------------------------------ */

export type BaseLayerKey = 'MAP' | 'SATELLITE' | 'TERRAIN';

export interface MapLayerToggles {
  drones: boolean;
  /** Unverified AI output: pending, under review, uncertain, rejected. */
  detections: boolean;
  /** Operator-confirmed survivors only. */
  survivors: boolean;
  teams: boolean;
  searchArea: boolean;
  coverage: boolean;
  incidents: boolean;
  flightPath: boolean;
}
