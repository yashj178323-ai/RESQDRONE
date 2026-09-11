import type { AppAction } from './actions';
import type { MapSlice } from './state';
import { initialState } from './state';

export function mapReducer(state: MapSlice, action: AppAction): MapSlice {
  switch (action.type) {
    case 'map/setBase':
      return { ...state, base: action.base };
    case 'map/toggleLayer':
      return { ...state, layers: { ...state.layers, [action.key]: !state.layers[action.key] } };
    case 'map/focus':
      return {
        ...state,
        focus: {
          lat: action.lat,
          lng: action.lng,
          zoom: action.zoom ?? 16,
          nonce: (state.focus?.nonce ?? 0) + 1,
        },
      };
    case 'app/reset':
      return initialState.map;
    default:
      return state;
  }
}
