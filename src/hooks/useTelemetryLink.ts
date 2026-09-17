import { useEffect, useRef } from 'react';
import { useAppDispatch, useSystemState } from '@/context/AppStore';
import { makeAlert } from '@/context/store/actions';
import { subscribeTelemetry, backendConfigured } from '@/services/telemetry/telemetryLink';
import { hasBackend } from '@/services/api/client';
import { hasRealtimeBackend } from '@/services/websocket/socket';

/** No frame within this window means the link is up but not delivering. */
const TELEMETRY_WATCHDOG_MS = 6000;

/**
 * Owns the truth about whether live telemetry is flowing. Configuration alone
 * never reports CONNECTED — only a received frame does.
 */
export function useTelemetryLink(): void {
  const dispatch = useAppDispatch();
  const { connection } = useSystemState();
  const lastFrameRef = useRef(0);
  const announced = useRef(false);

  useEffect(() => {
    if (!backendConfigured) {
      dispatch({
        type: 'system/setConnection',
        patch: {
          telemetryLink: 'LOCAL_SIMULATOR',
          restApi: 'NOT_CONFIGURED',
          websocket: 'NOT_CONFIGURED',
        },
      });
      return;
    }

    dispatch({
      type: 'system/setConnection',
      patch: {
        telemetryLink: 'CONNECTING',
        restApi: hasBackend ? 'CONNECTING' : 'NOT_CONFIGURED',
        websocket: hasRealtimeBackend ? 'CONNECTING' : 'NOT_CONFIGURED',
      },
    });

    const teardown = subscribeTelemetry({
      onOpen: () => {
        // The socket is open, but telemetry is not confirmed until a frame lands.
        dispatch({ type: 'system/setConnection', patch: { websocket: 'CONNECTED' } });
      },
      onClose: (reason) => {
        dispatch({
          type: 'system/setConnection',
          patch: { websocket: 'OFFLINE', telemetryLink: 'OFFLINE' },
        });
        dispatch(
          makeAlert('WARNING', 'Backend telemetry link closed', `${reason} — falling back to the local simulator`),
        );
      },
      onError: (message) => {
        dispatch({
          type: 'system/setConnection',
          patch: { websocket: 'OFFLINE', telemetryLink: 'OFFLINE' },
        });
        if (!announced.current) {
          announced.current = true;
          dispatch(
            makeAlert('WARNING', 'Backend unavailable', `${message} — running on the local simulator`),
          );
        }
      },
      onTelemetry: (frame) => {
        lastFrameRef.current = Date.now();
        dispatch({ type: 'drone/patch', telemetry: frame });
        dispatch({ type: 'system/setConnection', patch: { telemetryLink: 'CONNECTED' } });
      },
    });

    if (!teardown) {
      // REST configured but no socket: telemetry cannot stream, so say so.
      dispatch({
        type: 'system/setConnection',
        patch: { telemetryLink: 'DEGRADED', websocket: 'NOT_CONFIGURED' },
      });
    }

    return () => teardown?.();
  }, [dispatch]);

  useEffect(() => {
    if (connection.telemetryLink !== 'CONNECTED') return;
    const id = window.setInterval(() => {
      if (Date.now() - lastFrameRef.current > TELEMETRY_WATCHDOG_MS) {
        dispatch({ type: 'system/setConnection', patch: { telemetryLink: 'DEGRADED' } });
        dispatch(
          makeAlert('WARNING', 'Telemetry stalled', 'No frame received recently — showing the last known state'),
        );
      }
    }, TELEMETRY_WATCHDOG_MS);
    return () => window.clearInterval(id);
  }, [connection.telemetryLink, dispatch]);
}
