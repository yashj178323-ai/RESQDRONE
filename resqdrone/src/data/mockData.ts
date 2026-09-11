import type {
  Alert,
  Detection,
  Dispatch,
  Drone,
  Incident,
  LatLng,
  Mission,
  MissionEvent,
  RescueTeam,
  SearchArea,
  Survivor,
  SystemHealth,
  Telemetry,
} from '@/types';
import type { HardwareLink, SensorEvent, ThermalFrame } from '@/types';
import { lawnmowerPath, polygonAreaKm2, rectAround } from '@/utils/geo';
import { THERMAL_AMBIENT_C, THERMAL_GRID_SIZE } from '@/config/constants';

/** Demonstration theatre: Pune, Maharashtra — Mula riverside flood scenario. */
export const PUNE_CENTER: LatLng = { lat: 18.5204, lng: 73.8567 };
export const BASE_STATION: LatLng = { lat: 18.5108, lng: 73.8402 };

export const ZONE_A_POLYGON = rectAround(PUNE_CENTER, 2.4, 1.85);
export const ZONE_B_POLYGON = rectAround({ lat: 18.5352, lng: 73.8712 }, 2.0, 1.6);
export const ZONE_C_POLYGON = rectAround({ lat: 18.5061, lng: 73.8748 }, 1.9, 1.5);
export const ZONE_D_POLYGON = rectAround({ lat: 18.5289, lng: 73.8352 }, 1.6, 1.3);

/** The drone flies this boustrophedon sweep across Zone A. */
export const FLIGHT_PATH: LatLng[] = lawnmowerPath(ZONE_A_POLYGON, 9);

export const OPERATOR = { name: 'Prathamesh', initials: 'PP', role: 'Flight operator' };

export const DRONES: Drone[] = [
  { id: 'RQ-01', model: 'ResQ Quad X4', callSign: 'RQ-01', status: 'SEARCHING' },
  { id: 'RQ-02', model: 'ResQ Quad X4', callSign: 'RQ-02', status: 'IDLE' },
];

export const INITIAL_TELEMETRY: Telemetry = {
  droneId: 'RQ-01',
  latitude: FLIGHT_PATH[0].lat,
  longitude: FLIGHT_PATH[0].lng,
  altitude: 85,
  speed: 8.2,
  heading: 127,
  battery: 78,
  satellites: 14,
  signal: 'STRONG',
  gpsStatus: 'LOCKED',
  communication: 'CONNECTED',
  missionStatus: 'SEARCHING',
  flightTimeSec: 754,
  distanceKm: 3.1,
  updatedAt: Date.now(),
};

export const INITIAL_HEALTH: SystemHealth = {
  flightController: 'ONLINE',
  gps: 'ONLINE',
  motors: 'HEALTHY',
  battery: 'NORMAL',
  rgbCamera: 'ONLINE',
  thermalCamera: 'ONLINE',
  aiEngine: 'ACTIVE',
  communication: 'ONLINE',
};

const now = Date.now();
const minutesAgo = (m: number) => now - m * 60_000;

export const MISSIONS: Mission[] = [
  {
    id: 'FLOOD-042',
    name: 'Mission Alpha',
    disaster: 'FLOOD',
    location: 'Mula riverside, Pune, Maharashtra',
    status: 'ACTIVE',
    priority: 'P1',
    createdAt: minutesAgo(36),
    startedAt: minutesAgo(28),
    droneIds: ['RQ-01'],
    areaKm2: 8.1,
    searchAltitude: 85,
    pattern: 'LAWNMOWER',
    survivorsConfirmed: 2,
    teamsDispatched: 1,
    durationSec: 2160,
    assignedTeamId: 'TEAM-ALPHA',
  },
  {
    id: 'FLOOD-041',
    name: 'Mission Sierra',
    disaster: 'FLOOD',
    location: 'Khadakwasla backwaters, Pune',
    status: 'COMPLETED',
    priority: 'P2',
    createdAt: minutesAgo(2880),
    startedAt: minutesAgo(2870),
    completedAt: minutesAgo(2670),
    droneIds: ['RQ-02'],
    areaKm2: 5.4,
    searchAltitude: 90,
    pattern: 'GRID',
    survivorsConfirmed: 5,
    teamsDispatched: 2,
    durationSec: 12_000,
  },
  {
    id: 'LAND-017',
    name: 'Mission Ridge',
    disaster: 'LANDSLIDE',
    location: 'Malin ghat section, Pune district',
    status: 'COMPLETED',
    priority: 'P1',
    createdAt: minutesAgo(7200),
    startedAt: minutesAgo(7190),
    completedAt: minutesAgo(6900),
    droneIds: ['RQ-01'],
    areaKm2: 3.2,
    searchAltitude: 110,
    pattern: 'PERIMETER',
    survivorsConfirmed: 2,
    teamsDispatched: 1,
    durationSec: 17_400,
  },
];

export const SEARCH_AREAS: SearchArea[] = [
  {
    id: 'ZONE-A',
    missionId: 'FLOOD-042',
    name: 'Search Zone A',
    status: 'IN_PROGRESS',
    progress: 68,
    areaSearchedKm2: 2.9,
    totalAreaKm2: Number(polygonAreaKm2(ZONE_A_POLYGON).toFixed(1)),
    flightTimeSec: 754,
    distanceKm: 3.1,
    detections: 4,
    verified: 1,
    polygon: ZONE_A_POLYGON,
  },
  {
    id: 'ZONE-B',
    missionId: 'FLOOD-042',
    name: 'Search Zone B',
    status: 'PENDING',
    progress: 0,
    areaSearchedKm2: 0,
    totalAreaKm2: Number(polygonAreaKm2(ZONE_B_POLYGON).toFixed(1)),
    flightTimeSec: 0,
    distanceKm: 0,
    detections: 0,
    verified: 0,
    polygon: ZONE_B_POLYGON,
  },
  {
    id: 'ZONE-C',
    missionId: 'FLOOD-042',
    name: 'Search Zone C',
    status: 'PENDING',
    progress: 0,
    areaSearchedKm2: 0,
    totalAreaKm2: Number(polygonAreaKm2(ZONE_C_POLYGON).toFixed(1)),
    flightTimeSec: 0,
    distanceKm: 0,
    detections: 0,
    verified: 0,
    polygon: ZONE_C_POLYGON,
  },
  {
    id: 'ZONE-D',
    missionId: 'FLOOD-042',
    name: 'Search Zone D',
    status: 'COMPLETED',
    progress: 100,
    areaSearchedKm2: Number(polygonAreaKm2(ZONE_D_POLYGON).toFixed(1)),
    totalAreaKm2: Number(polygonAreaKm2(ZONE_D_POLYGON).toFixed(1)),
    flightTimeSec: 1180,
    distanceKm: 4.6,
    detections: 1,
    verified: 1,
    polygon: ZONE_D_POLYGON,
  },
];

export const DETECTIONS: Detection[] = [
  {
    id: 'DET-001',
    missionId: 'FLOOD-042',
    droneId: 'RQ-01',
    areaId: 'ZONE-A',
    timestamp: minutesAgo(22),
    rgbConfidence: 0.88,
    thermalConfidence: 0.93,
    fusedConfidence: 0.904,
    latitude: 18.5253,
    longitude: 73.8641,
    altitude: 85,
    priority: 'P2',
    verification: 'CONFIRMED',
    reasons: ['RGB and thermal agree', 'Stationary on rooftop', 'Team access route available'],
  },
  {
    id: 'DET-002',
    missionId: 'FLOOD-042',
    droneId: 'RQ-01',
    areaId: 'ZONE-A',
    timestamp: minutesAgo(18),
    rgbConfidence: 0.61,
    thermalConfidence: 0.68,
    fusedConfidence: 0.652,
    latitude: 18.5188,
    longitude: 73.8598,
    altitude: 85,
    priority: 'P4',
    verification: 'FALSE_DETECTION',
    reasons: ['Thermal signature matched vehicle bonnet', 'No movement across 40 frames'],
    note: 'Operator review: parked vehicle, not a person.',
  },
  {
    id: 'DET-003',
    missionId: 'FLOOD-042',
    droneId: 'RQ-01',
    areaId: 'ZONE-A',
    timestamp: minutesAgo(9),
    rgbConfidence: 0.74,
    thermalConfidence: 0.81,
    fusedConfidence: 0.781,
    latitude: 18.5162,
    longitude: 73.8489,
    altitude: 85,
    priority: 'P3',
    verification: 'UNDER_REVIEW',
    reasons: ['Partial occlusion by tree line', 'Thermal above ambient by 6.4 °C'],
  },
  {
    id: 'DET-004',
    missionId: 'FLOOD-042',
    droneId: 'RQ-01',
    areaId: 'ZONE-A',
    timestamp: minutesAgo(4),
    rgbConfidence: 0.91,
    thermalConfidence: 0.99,
    fusedConfidence: 0.964,
    latitude: 18.5231,
    longitude: 73.8629,
    altitude: 85,
    priority: 'P1',
    verification: 'PENDING',
    reasons: [
      'RGB and thermal agree',
      'High fused confidence',
      'Flooded surroundings, water above waist height',
      'No safe structure within 120 m',
      'Nearest team available',
    ],
  },
  {
    id: 'DET-005',
    missionId: 'FLOOD-042',
    droneId: 'RQ-01',
    areaId: 'ZONE-D',
    timestamp: minutesAgo(31),
    rgbConfidence: 0.83,
    thermalConfidence: 0.77,
    fusedConfidence: 0.806,
    latitude: 18.5298,
    longitude: 73.8371,
    altitude: 90,
    priority: 'P2',
    verification: 'CONFIRMED',
    reasons: ['Movement detected across 12 frames', 'Elevated thermal signature'],
  },
];

export const SURVIVORS: Survivor[] = [
  {
    id: 'SUR-001',
    detectionId: 'DET-001',
    latitude: 18.5253,
    longitude: 73.8641,
    priority: 'P2',
    confirmedAt: minutesAgo(21),
    status: 'AWAITING_DISPATCH',
  },
  {
    id: 'SUR-002',
    detectionId: 'DET-005',
    latitude: 18.5298,
    longitude: 73.8371,
    priority: 'P2',
    confirmedAt: minutesAgo(30),
    status: 'RESCUED',
  },
];

export const INCIDENTS: Incident[] = [
  { id: 'INC-001', detectionId: 'DET-001', priority: 'P2', state: 'OPEN', openedAt: minutesAgo(21) },
  {
    id: 'INC-002',
    detectionId: 'DET-005',
    priority: 'P2',
    state: 'RESOLVED',
    openedAt: minutesAgo(30),
    teamId: 'TEAM-BRAVO',
  },
];

export const RESCUE_TEAMS: RescueTeam[] = [
  {
    id: 'TEAM-ALPHA',
    name: 'Team Alpha',
    state: 'AVAILABLE',
    latitude: 18.5152,
    longitude: 73.8528,
    distanceKm: 1.4,
    etaSec: 252,
    capability: ['Swift water rescue', 'Medical first response', 'Inflatable boat'],
    members: 6,
  },
  {
    id: 'TEAM-BRAVO',
    name: 'Team Bravo',
    state: 'STANDBY',
    assignmentId: 'DET-005',
    latitude: 18.5312,
    longitude: 73.8688,
    distanceKm: 2.7,
    etaSec: 486,
    capability: ['Rope rescue', 'Structural access'],
    members: 5,
  },
  {
    id: 'TEAM-CHARLIE',
    name: 'Team Charlie',
    state: 'UNAVAILABLE',
    latitude: 18.5065,
    longitude: 73.8709,
    distanceKm: 4.1,
    etaSec: 780,
    capability: ['Casualty evacuation', 'Ambulance link'],
    members: 8,
  },
];

/** The completed Zone D response, so every counter has a record behind it. */
export const INITIAL_DISPATCHES: Dispatch[] = [
  {
    id: 'DSP-001',
    teamId: 'TEAM-BRAVO',
    detectionId: 'DET-005',
    dispatchedAt: minutesAgo(29),
    etaSec: 0,
    arrivedAt: minutesAgo(21),
    reasons: ['Nearest available team', 'Rope rescue capability', 'P2 incident'],
  },
];

export const INITIAL_TIMELINE: MissionEvent[] = [
  {
    id: 'EV-1',
    missionId: 'FLOOD-042',
    kind: 'MISSION_CREATED',
    label: 'Mission created',
    at: minutesAgo(36),
    state: 'DONE',
  },
  {
    id: 'EV-2',
    missionId: 'FLOOD-042',
    kind: 'DRONE_LAUNCHED',
    label: 'Drone launched',
    at: minutesAgo(28),
    state: 'DONE',
  },
  {
    id: 'EV-3',
    missionId: 'FLOOD-042',
    kind: 'SEARCH_STARTED',
    label: 'Search started',
    at: minutesAgo(25),
    state: 'DONE',
  },
  {
    id: 'EV-3b',
    missionId: 'FLOOD-042',
    kind: 'TEAM_ARRIVED',
    label: 'Team Bravo on scene',
    detail: 'Zone D · DET-005 rescued',
    at: minutesAgo(21),
    state: 'DONE',
  },
  {
    id: 'EV-4',
    missionId: 'FLOOD-042',
    kind: 'DETECTION',
    label: 'AI detection DET-004',
    detail: 'Fused confidence 96.4% · Zone A',
    at: minutesAgo(4),
    state: 'DONE',
  },
  {
    id: 'EV-5',
    missionId: 'FLOOD-042',
    kind: 'AWAITING_VERIFICATION',
    label: 'Awaiting operator review',
    detail: 'DET-004 · human verification required',
    at: minutesAgo(3),
    state: 'ACTIVE',
  },
  {
    id: 'EV-6',
    missionId: 'FLOOD-042',
    kind: 'TEAM_DISPATCHED',
    label: 'Team dispatched',
    at: null,
    state: 'PENDING',
  },
  {
    id: 'EV-7',
    missionId: 'FLOOD-042',
    kind: 'MISSION_COMPLETE',
    label: 'Mission complete',
    at: null,
    state: 'PENDING',
  },
];

export const INITIAL_ALERTS: Alert[] = [
  {
    id: 'AL-1',
    level: 'CRITICAL',
    title: 'Possible survivor detected — DET-004',
    detail: 'P1 · Zone A · 96.4% fused confidence · awaiting operator verification',
    at: minutesAgo(4),
    read: false,
  },
  {
    id: 'AL-2',
    level: 'WARNING',
    title: 'Battery projected to reach 30% in ~18 min',
    detail: 'RQ-01 at 78% · plan return-to-home before the threshold',
    at: minutesAgo(8),
    read: false,
  },
  {
    id: 'AL-3',
    level: 'INFO',
    title: 'Operating in local mode',
    detail: 'Drone link, GPS and AI run on this ground station · no internet required',
    at: minutesAgo(10),
    read: false,
  },
  {
    id: 'AL-4',
    level: 'SUCCESS',
    title: 'Search Zone A passed 50% coverage',
    detail: 'RQ-01 sweeping · lawnmower pattern at 85 m',
    at: minutesAgo(13),
    read: true,
  },
];

/* ------------------------------ Payload and avionics ------------------------------ */

/**
 * Hardware inventory for the demonstration rig. Every entry is flagged
 * `live: false` because these readings come from the local simulator — the UI
 * must never imply a board is genuinely attached.
 */
export const INITIAL_HARDWARE: HardwareLink[] = [
  {
    key: 'pixhawk',
    name: 'Pixhawk 2.4.8',
    state: 'CONNECTED',
    detail: 'MAVLink v2.0 · 115200 baud',
    live: false,
  },
  { key: 'tfLuna', name: 'TF-Luna LiDAR', state: 'LOCK', detail: 'I2C · 100 Hz', live: false },
  { key: 'esp32Cam', name: 'ESP32-CAM', state: 'STREAMING', detail: 'MJPEG · 12 fps', live: false },
  { key: 'amg8833', name: 'AMG8833', state: 'ACTIVE', detail: 'I2C 0x69 · 8x8 · 10 Hz', live: false },
];

/**
 * Builds one 8x8 thermal frame. Ambient cells drift slightly; when a target is
 * present a warm blob is placed at `hotIndex` and falls off with distance.
 */
export function makeThermalFrame(phase: number, target: boolean, peakC = 36.4): ThermalFrame {
  const size = THERMAL_GRID_SIZE;
  const grid: number[] = [];
  const targetX = 4;
  const targetY = 2;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      // Gentle ambient gradient: ground is warmer than sky-facing cells.
      let value =
        THERMAL_AMBIENT_C +
        Math.sin(phase * 0.5 + x * 0.4) * 0.35 +
        Math.cos(phase * 0.4 + y * 0.35) * 0.3 +
        y * 0.12;

      if (target) {
        const d = Math.hypot(x - targetX, y - targetY);
        const contribution = (peakC - THERMAL_AMBIENT_C) * Math.exp(-(d * d) / 2.1);
        value += contribution;
      }
      grid.push(Number(value.toFixed(2)));
    }
  }

  let hotIndex = 0;
  grid.forEach((v, i) => {
    if (v > grid[hotIndex]) hotIndex = i;
  });

  return {
    grid,
    size,
    minC: Number(Math.min(...grid).toFixed(2)),
    maxC: Number(Math.max(...grid).toFixed(2)),
    hotIndex,
    at: Date.now(),
  };
}

export const INITIAL_SENSOR_LOG: SensorEvent[] = [
  {
    id: 'LOG-1',
    at: minutesAgo(28),
    source: 'PIXHAWK',
    message: 'Link established · MAVLink v2.0 @ 115200',
    level: 'OK',
  },
  { id: 'LOG-2', at: minutesAgo(28), source: 'TF-LUNA', message: 'Ranging lock acquired', level: 'OK' },
  {
    id: 'LOG-3',
    at: minutesAgo(27),
    source: 'AMG8833',
    message: 'Thermal matrix streaming · 8x8 @ 10 Hz',
    level: 'OK',
  },
  { id: 'LOG-4', at: minutesAgo(27), source: 'ESP32-CAM', message: 'Payload stream online', level: 'OK' },
  {
    id: 'LOG-5',
    at: minutesAgo(4),
    source: 'AI',
    message: 'Thermal signature above threshold · DET-004',
    level: 'CRITICAL',
  },
  {
    id: 'LOG-6',
    at: minutesAgo(3),
    source: 'SYSTEM',
    message: 'Operator verification required',
    level: 'WARN',
  },
];

/** Analytics series derived from the demo mission, not random noise. */
export const BATTERY_HISTORY = [
  { t: '13:52', battery: 100, altitude: 0 },
  { t: '14:00', battery: 96, altitude: 42 },
  { t: '14:05', battery: 91, altitude: 85 },
  { t: '14:10', battery: 86, altitude: 85 },
  { t: '14:15', battery: 82, altitude: 86 },
  { t: '14:20', battery: 80, altitude: 85 },
  { t: '14:25', battery: 78, altitude: 85 },
];

export const COVERAGE_HISTORY = [
  { t: '14:03', coverage: 0 },
  { t: '14:07', coverage: 12 },
  { t: '14:11', coverage: 27 },
  { t: '14:15', coverage: 41 },
  { t: '14:19', coverage: 53 },
  { t: '14:23', coverage: 62 },
  { t: '14:27', coverage: 68 },
];
