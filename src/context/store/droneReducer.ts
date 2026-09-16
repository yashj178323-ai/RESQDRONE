import type { AppAction } from './actions';
import type { DroneSlice } from './state';
import { initialState } from './state';

export function droneReducer(state: DroneSlice, action: AppAction): DroneSlice {
  switch (action.type) {
    case 'drone/tick': {
      const travelled = [...state.travelled, action.point];
      return {
        ...state,
        telemetry: { ...state.telemetry, ...action.telemetry, updatedAt: Date.now() },
        pathProgress: action.pathProgress,
        // Keep the trail bounded so long missions never degrade map performance.
        travelled: travelled.length > 400 ? travelled.slice(travelled.length - 400) : travelled,
      };
    }
    case 'drone/patch':
      return { ...state, telemetry: { ...state.telemetry, ...action.telemetry } };
    case 'drone/setSimulating':
      return { ...state, simulating: action.value };
    case 'mission/setStatus':
      if (action.status === 'COMPLETED') {
        return {
          ...state,
          simulating: false,
          telemetry: { ...state.telemetry, missionStatus: 'RETURNING', speed: 9.6 },
        };
      }
      if (action.status === 'ACTIVE') {
        return {
          ...state,
          simulating: true,
          telemetry: { ...state.telemetry, missionStatus: 'SEARCHING' },
        };
      }
      return state;
    case 'app/reset':
      return initialState.drone;
    default:
      return state;
  }
}
