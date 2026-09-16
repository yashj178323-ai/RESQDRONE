import { getSocket, CHANNELS, hasRealtimeBackend } from '@/services/websocket/socket';
import { hasBackend } from '@/services/api/client';
import type { Telemetry } from '@/types';

export const backendConfigured = hasBackend || hasRealtimeBackend;

export const mapTileUrl =
  (import.meta.env.VITE_MAP_URL as string | undefined) ??
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

/** Normalised events the application understands, free of transport details. */
export interface TelemetryLinkHandlers {
  onOpen: () => void;
  onClose: (reason: string) => void;
  onError: (message: string) => void;
  onTelemetry: (frame: Partial<Telemetry>) => void;
}

/**
 * The only place that knows about Socket.IO. Returns a teardown function, and
 * returns null when no realtime backend is configured so callers can fall back
 * to the local simulator without special-casing transport code.
 */
export function subscribeTelemetry(handlers: TelemetryLinkHandlers): (() => void) | null {
  const socket = getSocket();
  if (!socket) return null;

  const onConnect = () => handlers.onOpen();
  const onDisconnect = (reason: string) => handlers.onClose(reason);
  const onError = (err: Error) => handlers.onError(err.message);
  const onFrame = (frame: Partial<Telemetry>) => handlers.onTelemetry(frame);

  socket.on('connect', onConnect);
  socket.on('disconnect', onDisconnect);
  socket.on('connect_error', onError);
  socket.on(CHANNELS.telemetry, onFrame);

  return () => {
    socket.off('connect', onConnect);
    socket.off('disconnect', onDisconnect);
    socket.off('connect_error', onError);
    socket.off(CHANNELS.telemetry, onFrame);
  };
}
