import { io, Socket } from 'socket.io-client';
import { config } from '../config';
import { getStoredToken } from './api';

let socket: Socket | null = null;
let initPromise: Promise<Socket> | null = null;

export const initSocket = async (): Promise<Socket> => {
  if (socket && socket.connected) {
    return socket;
  }
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      const token = await getStoredToken('moi_access_token');

      if (!socket) {
        socket = io(config.socketUrl, {
          auth: { token },
          transports: ['websocket', 'polling'], // Native WebSocket first (<5ms instant delivery)
          upgrade: true,
          autoConnect: true,
          reconnection: true,
          reconnectionAttempts: Infinity,
          reconnectionDelay: 500,
          reconnectionDelayMax: 3000,
          timeout: 10000
        });

        socket.on('connect', () => {
          console.log('[Socket Connected]:', socket?.id, 'via', (socket as any)?.io?.engine?.transport?.name);
        });

        socket.on('disconnect', (reason) => {
          console.log('[Socket Disconnected]:', reason);
        });

        socket.on('connect_error', (error) => {
          console.warn('[Socket Connect Error]:', error?.message || error);
        });
      } else {
        // Update auth token dynamically in case user logged in or refreshed token
        (socket as any).auth = { token };
        if (!socket.connected) {
          socket.connect();
        }
      }
    } catch (err) {
      console.error('[Socket Init Error]:', err);
    } finally {
      initPromise = null;
    }

    return socket as Socket;
  })();

  return initPromise;
};

export const getSocket = async (): Promise<Socket> => {
  if (socket && socket.connected) {
    return socket;
  }
  return await initSocket();
};

/**
 * Ensures the socket is not just initialized, but actively connected.
 * Waits up to timeoutMs for the connection handshake before resolving.
 */
export const ensureConnectedSocket = async (timeoutMs = 2500): Promise<Socket | null> => {
  const sock = await getSocket();
  if (!sock) return null;
  if (sock.connected) return sock;

  return new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(sock);
      }
    }, timeoutMs);

    const onConnect = () => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        sock.off('connect', onConnect);
        resolve(sock);
      }
    };

    sock.on('connect', onConnect);
    if (!sock.connected) {
      sock.connect();
    }
  });
};

export const getSocketSync = (): Socket | null => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
