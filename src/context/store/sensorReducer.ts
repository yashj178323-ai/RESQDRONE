import type { SensorSlice } from './state';
import type { AppAction } from './actions';
import { initialState } from './state';
import { MAX_LIDAR_SAMPLES, MAX_SENSOR_EVENTS } from '@/config/constants';

/**
 * Payload and avionics state. Kept apart from mission state because it updates
 * several times a second and only the instrument components consume it.
 */
export function sensorReducer(state: SensorSlice, action: AppAction): SensorSlice {
  switch (action.type) {
    case 'sensors/attitude':
      return { ...state, attitude: action.attitude };

    case 'sensors/lidar': {
      const samples = [...state.lidar, action.sample];
      return {
        ...state,
        lidar: samples.length > MAX_LIDAR_SAMPLES ? samples.slice(-MAX_LIDAR_SAMPLES) : samples,
      };
    }

    case 'sensors/thermal':
      return { ...state, thermal: action.frame };

    case 'sensors/setPalette':
      return { ...state, palette: action.palette };

    case 'sensors/setThreshold':
      return { ...state, thresholdC: action.thresholdC };

    case 'sensors/selectCell':
      return { ...state, selectedCell: action.index };

    case 'sensors/setTargetLock':
      return { ...state, targetLocked: action.locked };

    case 'sensors/setHardware':
      return {
        ...state,
        hardware: state.hardware.map((h) =>
          h.key === action.key ? { ...h, ...action.patch } : h,
        ),
      };

    case 'sensors/log': {
      const log = [...state.log, action.event];
      return { ...state, log: log.length > MAX_SENSOR_EVENTS ? log.slice(-MAX_SENSOR_EVENTS) : log };
    }

    case 'app/reset':
      return initialState.sensors;

    default:
      return state;
  }
}
