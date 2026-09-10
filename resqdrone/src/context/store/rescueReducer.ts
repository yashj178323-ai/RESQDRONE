import type { AppAction } from './actions';
import type { RescueSlice } from './state';
import { initialState } from './state';
import { TEAM_SPEED_KMPH } from '@/config/constants';

export function rescueReducer(state: RescueSlice, action: AppAction): RescueSlice {
  switch (action.type) {
    case 'rescue/recommend':
      return { ...state, recommendation: action.recommendation };

    case 'rescue/dismissRecommendation':
      return { ...state, recommendation: null };

    case 'rescue/dispatch': {
      const team = state.teams.find((t) => t.id === action.dispatch.teamId);
      const busy = !team || team.state === 'DISPATCHED' || team.state === 'ON_WAY';
      const duplicate = state.dispatches.some(
        (d) => d.detectionId === action.dispatch.detectionId && !d.arrivedAt,
      );
      if (busy || duplicate) return state;
      return {
        ...state,
        recommendation: null,
        dispatches: [action.dispatch, ...state.dispatches],
        teams: state.teams.map((t) =>
          t.id === action.dispatch.teamId
            ? {
                ...t,
                state: 'DISPATCHED',
                etaSec: action.dispatch.etaSec,
                assignmentId: action.dispatch.detectionId,
                route: action.route,
              }
            : t,
        ),
      };
    }

    case 'rescue/tick':
      return {
        ...state,
        teams: state.teams.map((t) => {
          if (t.state !== 'DISPATCHED' && t.state !== 'ON_WAY') return t;
          const etaSec = Math.max(0, t.etaSec - action.seconds);
          const travelled = (TEAM_SPEED_KMPH / 3600) * action.seconds;
          const distanceKm = Number(Math.max(0, t.distanceKm - travelled).toFixed(2));
          return { ...t, etaSec, distanceKm, state: etaSec > 0 ? 'ON_WAY' : t.state };
        }),
        dispatches: state.dispatches.map((d) =>
          d.arrivedAt ? d : { ...d, etaSec: Math.max(0, d.etaSec - action.seconds) },
        ),
      };

    case 'rescue/arrived': {
      const team = state.teams.find((t) => t.id === action.teamId);
      if (!team || team.state === 'ARRIVED') return state;
      return {
        ...state,
        teams: state.teams.map((t) =>
          t.id === action.teamId ? { ...t, state: 'ARRIVED', etaSec: 0, distanceKm: 0 } : t,
        ),
        dispatches: state.dispatches.map((d) =>
          d.teamId === action.teamId && !d.arrivedAt ? { ...d, arrivedAt: action.at, etaSec: 0 } : d,
        ),
      };
    }

    case 'app/reset':
      return initialState.rescue;

    default:
      return state;
  }
}
