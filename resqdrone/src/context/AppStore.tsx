import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import type { Dispatch, ReactNode } from 'react';
import type { AppAction } from './store/actions';
import type { AppState } from './store/state';
import { initialState } from './store/state';
import { rootReducer } from './store/rootReducer';
import { STORAGE_KEY, STORAGE_VERSION } from '@/config/constants';
import type { BaseLayerKey, MapLayerToggles, QueuedEvent } from '@/types';

interface StoreValue {
  state: AppState;
  dispatch: Dispatch<AppAction>;
}

const StoreContext = createContext<StoreValue | null>(null);

interface PersistedShape {
  version: number;
  base: BaseLayerKey;
  layers: Partial<MapLayerToggles>;
  queue: QueuedEvent[];
}

const BASE_KEYS: BaseLayerKey[] = ['MAP', 'SATELLITE', 'TERRAIN'];

/** Persisted data is untrusted input: validate field by field, never spread blind. */
function parsePersisted(raw: string, fallback: AppState): PersistedShape | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null) return null;
  const candidate = parsed as Partial<PersistedShape>;
  if (candidate.version !== STORAGE_VERSION) return null;

  const base = BASE_KEYS.includes(candidate.base as BaseLayerKey)
    ? (candidate.base as BaseLayerKey)
    : fallback.map.base;

  const layers: Partial<MapLayerToggles> = {};
  if (candidate.layers && typeof candidate.layers === 'object') {
    (Object.keys(fallback.map.layers) as (keyof MapLayerToggles)[]).forEach((key) => {
      const value = (candidate.layers as Record<string, unknown>)[key];
      if (typeof value === 'boolean') layers[key] = value;
    });
  }

  const queue = Array.isArray(candidate.queue)
    ? candidate.queue.filter(
        (q): q is QueuedEvent =>
          typeof q === 'object' &&
          q !== null &&
          typeof (q as QueuedEvent).id === 'string' &&
          typeof (q as QueuedEvent).payload === 'string',
      )
    : [];

  return { version: STORAGE_VERSION, base, layers, queue };
}

/** Only operator preferences and the unsent queue survive a reload. */
function hydrate(base: AppState): AppState {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return base;
  }
  if (!raw) return base;

  const saved = parsePersisted(raw, base);
  if (!saved) {
    // Malformed or from an older schema: discard rather than corrupt state.
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    return base;
  }

  return {
    ...base,
    map: { ...base.map, base: saved.base, layers: { ...base.map.layers, ...saved.layers } },
    system: { ...base.system, queue: saved.queue.filter((q) => q.status !== 'SYNCED') },
  };
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(rootReducer, initialState, hydrate);

  const { layers, base } = state.map;
  const { queue } = state.system;

  useEffect(() => {
    try {
      const payload: PersistedShape = { version: STORAGE_VERSION, base, layers, queue };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      /* storage unavailable — the app still works, it just will not remember */
    }
  }, [base, layers, queue]);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <AppStoreProvider>');
  return ctx;
}

export const useAppDispatch = () => useStore().dispatch;
export const useDroneState = () => useStore().state.drone;
export const useSensorState = () => useStore().state.sensors;
export const useTelemetry = () => useStore().state.drone.telemetry;
export const useMissionState = () => useStore().state.mission;
export const useIncidentState = () => useStore().state.incidents;
export const useRescueState = () => useStore().state.rescue;
export const useSystemState = () => useStore().state.system;
export const useConnection = () => useStore().state.system.connection;
export const useMapState = () => useStore().state.map;
export const useAppState = () => useStore().state;
