/** Domain constants. Anything a reviewer might want to tune lives here. */

/** Telemetry commit rate. One state commit per second keeps the map stable. */
export const TELEMETRY_INTERVAL_MS = 1000;

/** How often dispatched teams advance, and by how much simulated time. */
export const DISPATCH_TICK_MS = 1000;
export const DISPATCH_TICK_SECONDS = 3;

/** Assumed ground speed through flooded streets, used for ETA estimates. */
export const TEAM_SPEED_KMPH = 20;

/** Battery drain per telemetry tick, in percentage points. */
export const BATTERY_DRAIN_PER_TICK = 0.03;
export const BATTERY_WARN_PCT = 30;
export const BATTERY_CRITICAL_PCT = 15;

/** Bounded so a long mission cannot degrade map performance. */
export const MAX_TRAIL_POINTS = 400;
export const MAX_ALERTS = 60;

/** Flight-path polylines are rebuilt only when progress moves this far. */
export const PATH_PROGRESS_EPSILON = 0.002;

export const MAP_DEFAULT_ZOOM = 14;
export const MAP_FOCUS_ZOOM = 16;
export const MAP_DETAIL_ZOOM = 17;
export const MAP_MAX_ZOOM = 19;

export const STORAGE_KEY = 'resqdrone.local';
export const STORAGE_VERSION = 2;

export const SYNC_TICK_MS = 90;

export const GPS_MIN_HEALTHY_SATELLITES = 8;

/** Avionics and payload simulation. */
export const SENSOR_TICK_MS = 250;
export const THERMAL_TICK_MS = 1000;
export const THERMAL_GRID_SIZE = 8;
export const THERMAL_AMBIENT_C = 27.5;
export const THERMAL_DEFAULT_THRESHOLD_C = 33;
export const MAX_LIDAR_SAMPLES = 40; // 40 x 250 ms = 10 s of history
export const MAX_SENSOR_EVENTS = 120;
