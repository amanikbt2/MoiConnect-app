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
          transports: ['websocket', 'polling'],
          autoConnect: true
        });

        socket.on('connect', () => {
          console.log('[Socket Connected]:', socket?.id);
        });

        socket.on('disconnect', (reason) => {
          console.log('[Socket Disconnected]:', reason);
        });
      } else if (!socket.connected) {
        socket.connect();
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

export const getSocketSync = (): Socket | null => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
