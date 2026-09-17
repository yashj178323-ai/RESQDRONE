import { useEffect, useRef } from 'react';
import { useAppDispatch, useDroneState, useSystemState } from '@/context/AppStore';
import { makeAlert } from '@/context/store/actions';
import { FLIGHT_PATH } from '@/data/mockData';
import { pathLengthKm, pointAlongPath } from '@/utils/geo';
import {
  BATTERY_CRITICAL_PCT,
  BATTERY_DRAIN_PER_TICK,
  BATTERY_WARN_PCT,
  TELEMETRY_INTERVAL_MS as TICK_MS,
} from '@/config/constants';

const PATH_KM = pathLengthKm(FLIGHT_PATH);

/**
 * Drives the drone along its planned sweep whenever live telemetry is not
 * actually arriving. It stands down only on a confirmed backend link — a
 * configured URL that never delivers a frame is a degraded link, not a live one.
 */
export function useTelemetrySimulator(): void {
  const dispatch = useAppDispatch();
  const { simulating, pathProgress, telemetry } = useDroneState();
  const { connection } = useSystemState();

  // Refs keep the interval stable so the map is not torn down every second.
  const progressRef = useRef(pathProgress);
  const telemetryRef = useRef(telemetry);
  const warnedRef = useRef<Record<string, boolean>>({});

  progressRef.current = pathProgress;
  telemetryRef.current = telemetry;

  const linkLost = connection.droneLink === 'LOST';
  const gpsLost = connection.gps === 'NO_FIX';

  useEffect(() => {
    if (connection.telemetryLink === 'CONNECTED') return; // confirmed live frames win
    if (!simulating || linkLost) return;

    const id = window.setInterval(() => {
      const t = telemetryRef.current;
      const dt = TICK_MS / 1000;
      const speed = Math.max(0, t.speed + (Math.random() - 0.5) * 0.4);
      const advanceKm = (speed * dt) / 1000;
      const nextProgress = Math.min(1, progressRef.current + advanceKm / PATH_KM);
      const { point, heading } = pointAlongPath(FLIGHT_PATH, nextProgress);
      const battery = Math.max(0, t.battery - BATTERY_DRAIN_PER_TICK);
      const altitude = Math.max(40, t.altitude + (Math.random() - 0.5) * 0.6);

      dispatch({
        type: 'drone/tick',
        pathProgress: nextProgress,
        point,
        telemetry: {
          // While GPS has no fix the last known position is held, not invented.
          latitude: gpsLost ? t.latitude : point.lat,
          longitude: gpsLost ? t.longitude : point.lng,
          heading: gpsLost ? t.heading : Math.round(heading),
          altitude: Number(altitude.toFixed(1)),
          speed: Number(speed.toFixed(1)),
          battery: Number(battery.toFixed(1)),
          flightTimeSec: t.flightTimeSec + 1,
          distanceKm: Number((t.distanceKm + advanceKm).toFixed(2)),
        },
      });

      if (battery <= BATTERY_WARN_PCT && !warnedRef.current.b30) {
        warnedRef.current.b30 = true;
        dispatch(
          makeAlert('WARNING', 'Battery below 30%', 'Return-to-home recommended for RQ-01'),
        );
      }
      if (battery <= BATTERY_CRITICAL_PCT && !warnedRef.current.b15) {
        warnedRef.current.b15 = true;
        dispatch(makeAlert('CRITICAL', 'Battery below 15%', 'Return to home now'));
      }
      if (nextProgress >= 1 && !warnedRef.current.done) {
        warnedRef.current.done = true;
        dispatch(makeAlert('SUCCESS', 'Search Zone A fully covered', '4.3 km² searched'));
      }
    }, TICK_MS);

    return () => window.clearInterval(id);
  }, [connection.telemetryLink, dispatch, gpsLost, linkLost, simulating]);
}
