import { useEffect } from 'react';
import { useAppDispatch, useMissionState, useSystemState } from '@/context/AppStore';
import { makeAlert, makeEvent } from '@/context/store/actions';
import { SYNC_TICK_MS } from '@/config/constants';

/** Drains the offline event queue once the uplink comes back. */
export function useSyncEngine(): void {
  const dispatch = useAppDispatch();
  const { sync, connection } = useSystemState();
  const { activeMissionId } = useMissionState();

  const running = Boolean(sync && !sync.complete && connection.cloud === 'SYNCING');

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => dispatch({ type: 'system/syncTick' }), SYNC_TICK_MS);
    return () => window.clearInterval(id);
  }, [dispatch, running]);

  useEffect(() => {
    if (!sync?.complete || connection.cloud !== 'SYNCING') return;
    dispatch({ type: 'system/syncComplete' });
    dispatch(makeEvent(activeMissionId, 'SYNC', 'Event synchronisation complete'));
    dispatch(
      makeAlert('SUCCESS', 'Synchronisation complete', `${sync.total} queued events uploaded`),
    );
  }, [activeMissionId, connection.cloud, dispatch, sync]);
}
