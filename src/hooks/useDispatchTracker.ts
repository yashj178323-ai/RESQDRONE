import { useEffect } from 'react';
import { useAppDispatch, useMissionState, useRescueState } from '@/context/AppStore';
import { makeAlert, makeEvent, makeQueued } from '@/context/store/actions';
import { useSystemState } from '@/context/AppStore';
import { DISPATCH_TICK_MS, DISPATCH_TICK_SECONDS } from '@/config/constants';

/** Counts down live ETAs for dispatched teams and raises the arrival event. */
export function useDispatchTracker(): void {
  const dispatch = useAppDispatch();
  const { teams } = useRescueState();
  const { activeMissionId } = useMissionState();
  const { connection } = useSystemState();

  const enRoute = teams.filter((t) => t.state === 'DISPATCHED' || t.state === 'ON_WAY');
  const enRouteKey = enRoute.map((t) => t.id).join(',');

  useEffect(() => {
    if (!enRouteKey) return;
    const id = window.setInterval(
      () => dispatch({ type: 'rescue/tick', seconds: DISPATCH_TICK_SECONDS }),
      DISPATCH_TICK_MS,
    );
    return () => window.clearInterval(id);
  }, [dispatch, enRouteKey]);

  useEffect(() => {
    const arrived = enRoute.find((t) => t.etaSec <= 0);
    if (!arrived) return;
    dispatch({ type: 'rescue/arrived', teamId: arrived.id, at: Date.now() });
    dispatch(makeEvent(activeMissionId, 'TEAM_ARRIVED', `${arrived.name} arrived on scene`));
    if (connection.cloud !== 'ONLINE') dispatch(makeQueued('TEAM_ARRIVED', arrived.id));
    dispatch(
      makeAlert(
        'SUCCESS',
        `${arrived.name} arrived`,
        connection.cloud === 'ONLINE'
          ? 'Team is on scene at the incident'
          : 'Team is on scene · queued locally, not yet sent',
      ),
    );
  }, [activeMissionId, connection.cloud, dispatch, enRoute]);
}
