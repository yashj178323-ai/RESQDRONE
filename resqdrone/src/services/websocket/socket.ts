import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';

const wsUrl = import.meta.env.VITE_WS_URL as string | undefined;

export const hasRealtimeBackend = Boolean(wsUrl && wsUrl.trim().length > 0);

let socket: Socket | null = null;

/**
 * Returns a Socket.IO client only when VITE_WS_URL is set. Without it we return
 * null rather than opening a socket that would retry-loop against nothing —
 * the local simulator drives the UI instead.
 */
export function getSocket(): Socket | null {
  if (!hasRealtimeBackend) return null;
  if (!socket) {
    socket = io(wsUrl as string, {
      autoConnect: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 2000,
      transports: ['websocket'],
    });
  }
  return socket;
}

export function closeSocket(): void {
  socket?.close();
  socket = null;
}

/** Channel names the future backend is expected to publish on. */
export const CHANNELS = {
  telemetry: 'telemetry:update',
  detection: 'detection:new',
  team: 'team:update',
  alert: 'alert:new',
} as const;
