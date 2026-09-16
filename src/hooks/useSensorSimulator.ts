import { useEffect, useRef } from 'react';
import { useAppDispatch, useSensorState, useSystemState } from '@/context/AppStore';
import { logEvent } from '@/context/store/actions';
import { makeThermalFrame } from '@/data/mockData';
import { SENSOR_TICK_MS, THERMAL_TICK_MS } from '@/config/constants';

/**
 * Drives the avionics and payload instruments: attitude at 4 Hz, TF-Luna
 * ranging at 4 Hz, AMG8833 frames at 1 Hz. Everything it produces is flagged as
 * simulated on the hardware bar, so no board is ever shown as truly attached.
 */
export function useSensorSimulator(): void {
  const dispatch = useAppDispatch();
  const { targetLocked, thresholdC } = useSensorState();
  const { connection, health } = useSystemState();

  const phase = useRef(0);
  const announced = useRef(false);
  const linkLost = connection.droneLink === 'LOST';
  const thermalOffline = health.thermalCamera === 'OFFLINE';

  useEffect(() => {
    if (linkLost) return;
    const id = window.setInterval(() => {
      phase.current += 0.25;
      const t = phase.current;

      dispatch({
        type: 'sensors/attitude',
        attitude: {
          pitch: Number((Math.sin(t * 0.6) * 4.5 + Math.sin(t * 1.7) * 0.8).toFixed(2)),
          roll: Number((Math.cos(t * 0.45) * 6.2 + Math.sin(t * 2.1) * 0.6).toFixed(2)),
          yaw: 0,
        },
      });

      // TF-Luna measures ground clearance on the bench rig, not flight altitude.
      dispatch({
        type: 'sensors/lidar',
        sample: {
          t: Date.now(),
          distanceM: Number((1.22 + Math.sin(t * 0.8) * 0.18 + (Math.random() - 0.5) * 0.04).toFixed(2)),
        },
      });
    }, SENSOR_TICK_MS);
    return () => window.clearInterval(id);
  }, [dispatch, linkLost]);

  useEffect(() => {
    if (linkLost || thermalOffline) return;
    const id = window.setInterval(() => {
      const frame = makeThermalFrame(phase.current, targetLocked);
      dispatch({ type: 'sensors/thermal', frame });

      if (frame.maxC >= thresholdC && !announced.current) {
        announced.current = true;
        dispatch(
          logEvent('AMG8833', `Thermal signature ${frame.maxC.toFixed(1)}°C above ${thresholdC}°C`, 'CRITICAL'),
        );
      }
      if (frame.maxC < thresholdC) announced.current = false;
    }, THERMAL_TICK_MS);
    return () => window.clearInterval(id);
  }, [dispatch, linkLost, targetLocked, thermalOffline, thresholdC]);
}
