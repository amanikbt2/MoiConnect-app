import { io, Socket } from 'socket.io-client';
import { config } from '../config';
import { getStoredToken } from './api';

let socket: Socket | null = null;

export const initSocket = async (): Promise<Socket> => {
  if (socket && socket.connected) {
    return socket;
  }

  const token = await getStoredToken('moi_access_token');

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

  return socket;
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
