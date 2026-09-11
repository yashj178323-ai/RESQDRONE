import type { Detection, Incident, Survivor } from '@/types';
import type { AppAction } from './actions';
import type { IncidentSlice } from './state';
import { initialState } from './state';

function patchDetection(
  list: Detection[],
  id: string,
  patch: Partial<Detection>,
): Detection[] {
  return list.map((d) => (d.id === id ? { ...d, ...patch } : d));
}

export function incidentReducer(state: IncidentSlice, action: AppAction): IncidentSlice {
  switch (action.type) {
    case 'incident/select':
      return { ...state, selectedDetectionId: action.detectionId };

    case 'incident/add': {
      if (state.detections.some((d) => d.id === action.detection.id)) return state;
      const incident: Incident = {
        id: action.incidentId,
        detectionId: action.detection.id,
        priority: action.detection.priority,
        state: 'OPEN',
        openedAt: action.detection.timestamp,
      };
      return {
        ...state,
        detections: [action.detection, ...state.detections],
        incidents: [incident, ...state.incidents],
        selectedDetectionId: action.detection.id,
      };
    }

    case 'incident/setVerification': {
      const current = state.detections.find((d) => d.id === action.detectionId);
      // Resolved detections are terminal: they cannot be re-opened by a stray click.
      if (
        !current ||
        current.verification === 'CONFIRMED' ||
        current.verification === 'FALSE_DETECTION'
      ) {
        return state;
      }
      return {
        ...state,
        detections: patchDetection(state.detections, action.detectionId, {
          verification: action.verification,
          note: action.note,
        }),
      };
    }

    case 'incident/confirm': {
      const detection = state.detections.find((d) => d.id === action.detectionId);
      if (!detection || detection.verification === 'CONFIRMED') return state;
      if (state.survivors.some((sv) => sv.detectionId === detection.id)) return state;
      const survivor: Survivor = {
        id: action.survivorId,
        detectionId: detection.id,
        latitude: detection.latitude,
        longitude: detection.longitude,
        priority: detection.priority,
        confirmedAt: action.at,
        status: 'AWAITING_DISPATCH',
      };
      return {
        ...state,
        detections: patchDetection(state.detections, detection.id, { verification: 'CONFIRMED' }),
        survivors: [survivor, ...state.survivors],
        incidents: state.incidents.some((i) => i.detectionId === detection.id)
          ? state.incidents
          : [
              {
                id: `INC-${detection.id}`,
                detectionId: detection.id,
                priority: detection.priority,
                state: 'OPEN',
                openedAt: action.at,
              },
              ...state.incidents,
            ],
      };
    }

    case 'rescue/dispatch': {
      const { detectionId, teamId } = action.dispatch;
      return {
        ...state,
        incidents: state.incidents.map((i) =>
          i.detectionId === detectionId ? { ...i, state: 'DISPATCHED', teamId } : i,
        ),
        survivors: state.survivors.map((s) =>
          s.detectionId === detectionId
            ? { ...s, status: 'TEAM_EN_ROUTE', assignedTeamId: teamId }
            : s,
        ),
      };
    }

    case 'rescue/arrived':
      return {
        ...state,
        incidents: state.incidents.map((i) =>
          i.teamId === action.teamId && i.state === 'DISPATCHED' ? { ...i, state: 'RESOLVED' } : i,
        ),
        survivors: state.survivors.map((s) =>
          s.assignedTeamId === action.teamId ? { ...s, status: 'RESCUED' } : s,
        ),
      };

    case 'app/reset':
      return initialState.incidents;

    default:
      return state;
  }
}
