import type { MissionEvent, SearchArea } from '@/types';
import type { AppAction } from './actions';
import type { MissionSlice } from './state';
import { initialState } from './state';

function patchArea(areas: SearchArea[], id: string, patch: Partial<SearchArea>): SearchArea[] {
  return areas.map((a) => (a.id === id ? { ...a, ...patch } : a));
}

/** Replace the first pending milestone of a kind, or append a fresh event. */
function resolveMilestone(
  timeline: MissionEvent[],
  kind: MissionEvent['kind'],
  at: number,
  detail?: string,
): MissionEvent[] {
  const idx = timeline.findIndex((e) => e.kind === kind && e.state === 'PENDING');
  if (idx === -1) return timeline;
  const next = [...timeline];
  next[idx] = { ...next[idx], at, state: 'DONE', detail: detail ?? next[idx].detail };
  return next;
}

export function missionReducer(state: MissionSlice, action: AppAction): MissionSlice {
  switch (action.type) {
    case 'mission/selectArea':
      return { ...state, selectedAreaId: action.areaId };

    case 'mission/patchArea':
      return { ...state, areas: patchArea(state.areas, action.areaId, action.patch) };

    case 'mission/setAreaProgress':
      return {
        ...state,
        areas: patchArea(state.areas, action.areaId, {
          progress: action.progress,
          areaSearchedKm2: action.areaSearchedKm2,
          status: action.progress >= 100 ? 'COMPLETED' : 'IN_PROGRESS',
        }),
      };

    case 'drone/tick': {
      // The active zone's coverage tracks the drone's progress along its sweep.
      const active = state.areas.find((a) => a.status === 'IN_PROGRESS');
      if (!active) return state;
      const progress = Math.min(100, Math.round(action.pathProgress * 100));
      const searched = Number(((progress / 100) * active.totalAreaKm2).toFixed(2));
      const flightTimeSec = action.telemetry.flightTimeSec ?? active.flightTimeSec;
      const distanceKm = action.telemetry.distanceKm ?? active.distanceKm;
      if (progress === active.progress && flightTimeSec === active.flightTimeSec) return state;
      return {
        ...state,
        areas: patchArea(state.areas, active.id, {
          progress,
          areaSearchedKm2: searched,
          flightTimeSec,
          distanceKm,
          status: progress >= 100 ? 'COMPLETED' : 'IN_PROGRESS',
        }),
      };
    }

    case 'mission/setStatus': {
      const missions = state.missions.map((m) =>
        m.id === action.missionId
          ? {
              ...m,
              status: action.status,
              startedAt: action.status === 'ACTIVE' ? m.startedAt ?? Date.now() : m.startedAt,
              completedAt: action.status === 'COMPLETED' ? Date.now() : m.completedAt,
            }
          : m,
      );
      const timeline =
        action.status === 'COMPLETED'
          ? resolveMilestone(state.timeline, 'MISSION_COMPLETE', Date.now())
          : state.timeline;
      return { ...state, missions, timeline };
    }

    case 'mission/create':
      return {
        ...state,
        missions: [action.mission, ...state.missions],
        areas: [...state.areas, action.area],
      };

    case 'mission/addEvent': {
      // A queued milestone of the same kind is filled in rather than duplicated.
      const resolved = resolveMilestone(
        state.timeline,
        action.event.kind,
        action.event.at ?? Date.now(),
        action.event.detail,
      );
      if (resolved !== state.timeline) {
        return { ...state, timeline: clearActive(resolved) };
      }
      return { ...state, timeline: clearActive([...state.timeline, action.event]) };
    }

    case 'mission/resolveEvent':
      return {
        ...state,
        timeline: resolveMilestone(state.timeline, action.kind, action.at, action.detail),
      };

    case 'incident/add': {
      const area = state.areas.find((a) => a.id === action.detection.areaId);
      const areas = area
        ? patchArea(state.areas, area.id, { detections: area.detections + 1 })
        : state.areas;
      return { ...state, areas };
    }

    case 'incident/confirm': {
      const missions = state.missions.map((m) =>
        m.id === state.activeMissionId
          ? { ...m, survivorsConfirmed: m.survivorsConfirmed + 1 }
          : m,
      );
      const active = state.areas.find((a) => a.status === 'IN_PROGRESS');
      const areas = active
        ? patchArea(state.areas, active.id, { verified: active.verified + 1 })
        : state.areas;
      return { ...state, missions, areas };
    }

    case 'rescue/dispatch': {
      const missions = state.missions.map((m) =>
        m.id === state.activeMissionId ? { ...m, teamsDispatched: m.teamsDispatched + 1 } : m,
      );
      return { ...state, missions };
    }

    case 'mission/reset':
    case 'app/reset':
      return initialState.mission;

    default:
      return state;
  }
}

/** Only the latest unfinished milestone should read as ACTIVE. */
function clearActive(timeline: MissionEvent[]): MissionEvent[] {
  const firstPending = timeline.findIndex((e) => e.state === 'PENDING');
  return timeline.map((e, i) => {
    if (e.state === 'ACTIVE' && i !== firstPending) return { ...e, state: 'DONE' as const };
    return e;
  });
}
