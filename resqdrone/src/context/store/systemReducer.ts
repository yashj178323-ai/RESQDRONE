import type { AppAction } from './actions';
import type { SystemSlice } from './state';
import { initialState } from './state';
import { MAX_ALERTS } from '@/config/constants';

export function systemReducer(state: SystemSlice, action: AppAction): SystemSlice {
  switch (action.type) {
    case 'system/alert':
      return { ...state, alerts: [action.alert, ...state.alerts].slice(0, MAX_ALERTS) };

    case 'system/readAlerts':
      return { ...state, alerts: state.alerts.map((a) => ({ ...a, read: true })) };

    case 'system/setConnection':
      return { ...state, connection: { ...state.connection, ...action.patch } };

    case 'system/setHealth':
      return { ...state, health: { ...state.health, ...action.patch } };

    case 'system/queue':
      // Idempotent: the same operator action never occupies two queue slots.
      if (state.queue.some((q) => q.id === action.event.id)) return state;
      return { ...state, queue: [...state.queue, action.event] };

    case 'system/startSync':
      return { ...state, sync: { total: action.total, done: 0, complete: false } };

    case 'system/syncTick': {
      if (!state.sync || state.sync.complete) return state;
      const done = Math.min(state.sync.total, state.sync.done + 1);
      // Drained in queue order, marking each event as it is acknowledged.
      const queue = state.queue.map((q, i) =>
        i < done ? { ...q, status: 'SYNCED' as const } : q,
      );
      return { ...state, queue, sync: { ...state.sync, done, complete: done >= state.sync.total } };
    }

    case 'system/syncComplete':
      return {
        ...state,
        queue: [],
        sync: state.sync ? { ...state.sync, done: state.sync.total, complete: true } : null,
        connection: { ...state.connection, cloud: 'ONLINE' },
      };

    case 'drone/tick':
      return {
        ...state,
        connection: { ...state.connection, lastTelemetryAt: Date.now() },
      };

    case 'app/reset':
      return initialState.system;

    default:
      return state;
  }
}
