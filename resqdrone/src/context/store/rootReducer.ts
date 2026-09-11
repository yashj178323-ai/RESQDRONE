import type { AppAction } from './actions';
import type { AppState } from './state';
import { droneReducer } from './droneReducer';
import { sensorReducer } from './sensorReducer';
import { incidentReducer } from './incidentReducer';
import { mapReducer } from './mapReducer';
import { missionReducer } from './missionReducer';
import { rescueReducer } from './rescueReducer';
import { systemReducer } from './systemReducer';

/**
 * Fans a single action out to every slice. Slices stay independent — no slice
 * reads another's state — while cross-cutting events stay consistent because
 * they are applied in one commit.
 */
export function rootReducer(state: AppState, action: AppAction): AppState {
  const drone = droneReducer(state.drone, action);
  const sensors = sensorReducer(state.sensors, action);
  const mission = missionReducer(state.mission, action);
  const incidents = incidentReducer(state.incidents, action);
  const rescue = rescueReducer(state.rescue, action);
  const system = systemReducer(state.system, action);
  const map = mapReducer(state.map, action);

  if (
    drone === state.drone &&
    sensors === state.sensors &&
    mission === state.mission &&
    incidents === state.incidents &&
    rescue === state.rescue &&
    system === state.system &&
    map === state.map
  ) {
    return state;
  }
  return { drone, sensors, mission, incidents, rescue, system, map };
}
