import type { ReactNode } from 'react';
import { useTelemetryLink } from '@/hooks/useTelemetryLink';
import { useTelemetrySimulator } from '@/hooks/useTelemetrySimulator';
import { useSensorSimulator } from '@/hooks/useSensorSimulator';
import { useDispatchTracker } from '@/hooks/useDispatchTracker';
import { useSyncEngine } from '@/hooks/useSyncEngine';

/**
 * Mounts the local engines exactly once for the whole app, so pages can be
 * navigated without restarting or duplicating any timers.
 */
export function SimulationProvider({ children }: { children: ReactNode }) {
  useTelemetryLink();
  useTelemetrySimulator();
  useSensorSimulator();
  useDispatchTracker();
  useSyncEngine();
  return <>{children}</>;
}
